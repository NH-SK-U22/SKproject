from flask import Blueprint, request, jsonify
import sqlite3
import os
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    # 開発/検証環境で dotenv が未インストールでも動作させる
    def load_dotenv(*args, **kwargs):
        return None
import google.generativeai as genai

ai_help_bp = Blueprint('ai_help', __name__)

# Gemini API設定
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    _configure = getattr(genai, "configure", None)
    if callable(_configure):
        _configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in environment variables")

def get_db_connection():
    """データベース接続を取得"""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@ai_help_bp.route('/api/ai-help', methods=['GET'])
def fetch_ai_advice():
    """既存のAIアドバイスのみを取得（生成はしない）"""
    try:
        sticky_id = request.args.get('sticky_id', type=int)
        student_id = request.args.get('student_id', type=int)
        if not sticky_id or not student_id:
            return jsonify({'error': 'sticky_id、student_idが必要です'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT ai_help FROM ai_help 
            WHERE sticky_id = ? AND student_id = ?
        ''', (sticky_id, student_id))

        row = cursor.fetchone()
        conn.close()

        advice_text = ''
        if row:
            if hasattr(row, 'keys') and 'ai_help' in row.keys():
                advice_text = row['ai_help']
            else:
                advice_text = row[0]
        return jsonify({'advice': advice_text or ''}), 200
    except Exception as e:
        return jsonify({'error': f'AIアドバイスの取得に失敗しました: {str(e)}'}), 500


@ai_help_bp.route('/api/ai-help/generate', methods=['POST'])
def generate_ai_advice():
    """AIアドバイスを生成して保存（メッセージ送信時にのみ呼ぶ）"""
    try:
        data = request.get_json()
        sticky_id = data.get('sticky_id')
        student_id = data.get('student_id')
        school_id = data.get('school_id')

        if not sticky_id or not student_id or not school_id:
            return jsonify({'error': 'sticky_id、student_id、school_idが必要です'}), 400

        # データベースから最新のメッセージを取得
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 指定されたsticky_idのメッセージ数を取得
        cursor.execute('''
            SELECT COUNT(*) as message_count
            FROM message 
            WHERE sticky_id = ?
        ''', (sticky_id,))
        
        message_count_result = cursor.fetchone()
        message_count = message_count_result['message_count'] if message_count_result else 0
        
        # 指定されたsticky_idの最新メッセージを取得（最大10件）
        cursor.execute('''
            SELECT message_content, student_id, created_at
            FROM message 
            WHERE sticky_id = ? 
            ORDER BY created_at ASC
            LIMIT 10
        ''', (sticky_id,))
        
        messages = cursor.fetchall()
        print(messages)
        # ユーザーのランクを取得
        cursor.execute('''
            SELECT sum_point FROM students 
            WHERE student_id = ?
        ''', (student_id,))
        
        user_result = cursor.fetchone()
        if not user_result:
            conn.close()
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        
        sum_point = user_result['sum_point']
        
        # ランクを計算
        rank_name = compute_rank_name(sum_point)
        
        # 既存のアドバイスを確認
        cursor.execute('''
            SELECT ai_help FROM ai_help 
            WHERE sticky_id = ? AND student_id = ?
        ''', (sticky_id, student_id))
        
        existing_advice = cursor.fetchone()
        
        # メッセージの内容を分析してアドバイスを生成（発言者: 自分/他者 を考慮）
        advice = generate_advice(messages, rank_name, student_id)
        
        # データベースに保存または更新
        if existing_advice:
            cursor.execute('''
                UPDATE ai_help 
                SET ai_help = ? 
                WHERE sticky_id = ? AND student_id = ?
            ''', (advice, sticky_id, student_id))
        else:
            cursor.execute('''
                INSERT INTO ai_help (sticky_id, student_id, school_id, ai_help)
                VALUES (?, ?, ?, ?)
            ''', (sticky_id, student_id, school_id, advice))
        
        conn.commit()
        final_advice = advice
        conn.close()
        return jsonify({'advice': final_advice}), 200
        
    except Exception as e:
        return jsonify({'error': f'AIアドバイスの取得に失敗しました: {str(e)}'}), 500

def compute_rank_name(sum_point):
    """合計ポイントからランク名を計算"""
    if sum_point >= 2000:
        return "ダイヤモンド"
    elif sum_point >= 1000:
        return "ゴールド"
    elif sum_point >= 500:
        return "シルバー"
    else:
        return "ブロンズ"

def generate_advice(messages, rank_name, current_student_id):
    """メッセージの内容を基にGemini APIを使用してランク別の高度なアドバイスを生成"""
    # メッセージの内容（統計用: 生テキスト）と表示用（発言者ラベル+student_id）を分離
    raw_messages = [msg['message_content'] for msg in messages]
    labeled_messages = [
        ("自分" if msg['student_id'] == current_student_id else "他者")
        + f"(student_id:{msg['student_id']}): "
        + msg['message_content']
        for msg in messages
    ]
    
    # 基本的な分析
    total_messages = len(raw_messages)
    avg_length = sum(len(text) for text in raw_messages) / total_messages if total_messages > 0 else 0
    my_count = sum(1 for msg in messages if msg['student_id'] == current_student_id)
    other_count = total_messages - my_count
    last_speaker_is_self = bool(messages and messages[0]['student_id'] == current_student_id)
    last_speaker_label = "自分" if last_speaker_is_self else "他者"
    
    # ランクに応じたプロンプトを生成
    rank_prompts = {
        "ダイヤモンド": {
            "context": "あなたは教育の専門家で、高度な議論スキルを持つ学生向けのアドバイザーです。",
            "focus": "短い示唆、要点の絞り込み、次の一手のみを示す",
            "style": "控えめで戦略的、簡潔な助言（最小限の手助け）"
        },
        "ゴールド": {
            "context": "あなたは教育の専門家で、中級レベルの議論スキルを持つ学生向けのアドバイザーです。",
            "focus": "ヒント中心、質問の質向上、議論の整理",
            "style": "控えめで実践的、要点中心（必要最小限の助言）"
        },
        "シルバー": {
            "context": "あなたは教育の専門家で、初級レベルの議論スキルを持つ学生向けのアドバイザーです。",
            "focus": "積極的な参加、基本スキルの強化、具体的な手順の提示",
            "style": "詳細で実践的、手順や例を含む助言"
        },
        "ブロンズ": {
            "context": "あなたは教育の専門家で、初心者の学生向けのアドバイザーです。",
            "focus": "基本的な参加、分かりやすい例、段階的な成長支援",
            "style": "非常に丁寧で段階的、例と手順を重視（最も手厚い助言）"
        }
    }
    
    rank_info = rank_prompts.get(rank_name, rank_prompts["ブロンズ"])
    
    # ランクに応じた出力ポリシー（低ランクほど詳細、高ランクほど控えめ）
    if rank_name == "ダイヤモンド":
        max_chars = 60
        detail_policy = "簡潔。専門用語は最小限。次の一手を1つだけ示す。箇条書きは最大1項目。"
    elif rank_name == "ゴールド":
        max_chars = 90
        detail_policy = "簡潔。ヒント中心。箇条書きは最大2項目。"
    elif rank_name == "シルバー":
        max_chars = 130
        detail_policy = "具体例と手順を含める。箇条書き2〜3項目。"
    else:  # ブロンズ
        max_chars = 150
        detail_policy = "噛み砕いた説明、ミニ手順、例を含める。箇条書きは最大3項目。"
    
    # Gemini APIを使用した高度なアドバイス生成
    try:
        if GEMINI_API_KEY:
            print(f"DEBUG: Attempting Gemini API call for AI advice with key: {GEMINI_API_KEY[:10]}...")
            _ModelClass = getattr(genai, "GenerativeModel", None)
            if not callable(_ModelClass):
                # SDK 仕様の差異などで利用できない場合はフォールバック
                return generate_advanced_advice(
                    rank_name,
                    raw_messages,
                    total_messages,
                    avg_length,
                    my_count,
                    other_count,
                    last_speaker_is_self,
                )
            gemini = _ModelClass("gemini-2.5-flash")
            
            # プロンプトの構築
            prompt = f"""
                {rank_info['context']}

                以下は、小学生の授業内容としてのディスカッションのやり取りです。議論を分析し、{rank_name}ランクの学生（小学生）に適したアドバイスを提供してください。
                高ランクほど控えめに、低ランクほど手厚く具体的に。余分な言葉（あなたの挨拶、）は要りません。アスタリスクは使わないでください
            

                【分析対象の議論】
                {chr(10).join([f"・{msg}" for msg in labeled_messages])}

                【学生のランク情報】
                - ランク: {rank_name}
                - メッセージ数: {total_messages}
                - 平均文字数: {avg_length:.1f}

                【発言者情報】
                - 自分の発言数: {my_count}
                - 他者の発言数: {other_count}
                - 直近の発言者: {last_speaker_label}
                - 「自分」は student_id:{current_student_id} の学生を指す

                【アドバイスの焦点】
                {rank_info['focus']}

                【アドバイスのスタイル】
                {rank_info['style']}

                出力要件:
                1. {max_chars}文字以内
                2. {detail_policy}
                3. 日本語で回答
                4. 学生を励ます一言を含める
                5. アドバイスは「自分が次に何を話すべきか」を中心に、発言量のバランス（自分/他者）と直近の発言者を考慮して具体的に示す

                アドバイス：
                """
            
            response = gemini.generate_content(prompt)
            ai_advice = response.text if hasattr(response, "text") else str(response)
            print(f"DEBUG: Gemini API response for AI advice: {ai_advice}")
            
            # AIアドバイスが空またはエラーの場合のフォールバック
            if not ai_advice or len(ai_advice.strip()) < 10:
                return generate_advanced_advice(
                    rank_name,
                    raw_messages,
                    total_messages,
                    avg_length,
                    my_count,
                    other_count,
                    last_speaker_is_self,
                )
            
            return ai_advice.strip()
            
        else:
            print("DEBUG: No GEMINI_API_KEY found, using fallback")
            return generate_advanced_advice(
                rank_name,
                raw_messages,
                total_messages,
                avg_length,
                my_count,
                other_count,
                last_speaker_is_self,
            )
            
    except Exception as e:
        print(f"DEBUG: Gemini API call failed: {e}")
        return generate_advanced_advice(
            rank_name,
            raw_messages,
            total_messages,
            avg_length,
            my_count,
            other_count,
            last_speaker_is_self,
        )

def generate_advanced_advice(rank_name, message_contents, total_messages, avg_length, my_count, other_count, last_speaker_is_self):
    """ランク別の高度なアドバイスを生成（低ランクほど詳細、高ランクほど控えめ）"""
    # メッセージの内容を分析
    has_questions = any('?' in msg or '？' in msg for msg in message_contents)
    has_examples = any('例えば' in msg or '例：' in msg or '例として' in msg for msg in message_contents)
    has_agreement = any('同意' in msg or '賛成' in msg or 'そうですね' in msg for msg in message_contents)
    has_disagreement = any('反対' in msg or '異議' in msg or '違う' in msg for msg in message_contents)
    # 発言者バランスに応じたヒント
    speaker_hint = ""
    if my_count == 0:
        speaker_hint = " まず一言で参加してみよう。"
    elif my_count > other_count:
        speaker_hint = " 発言は短く、相手に質問して流れを渡そう。"
    else:
        speaker_hint = " 要点を一つに絞り、相手の考えを引き出そう。"
    if last_speaker_is_self:
        speaker_hint += " 最後に話したのは自分。相手への質問で区切ろう。"
    else:
        speaker_hint += " 最後は相手の発言。要約→質問で応えよう。"
    
    if rank_name == "ダイヤモンド":
        if avg_length < 50:
            return "要点を1つに絞り、根拠を一言で。次の一手を短く提示しよう。" + speaker_hint
        elif not has_questions:
            return "核心への質問を1つだけ投げ、議論を前へ進めよう。" + speaker_hint
        else:
            return "結論を簡潔に整理し、合意形成の鍵を短く示そう。" + speaker_hint
    
    elif rank_name == "ゴールド":
        if avg_length < 30:
            return "主張を1文に圧縮し、根拠を短く追加。最後に次の一手を示そう。" + speaker_hint
        elif not has_examples:
            return "具体例を1つ添えて要点を明確に。質問を1つ足して深掘りしよう。" + speaker_hint
        else:
            return "論点を2点に整理し、相手へ建設的な質問を投げよう。" + speaker_hint
    
    elif rank_name == "シルバー":
        if avg_length < 20:
            return "1) 主張を短く書く 2) 具体例を1つ挙げる 3) 最後に質問を1つ。" + speaker_hint
        elif not has_agreement and not has_disagreement:
            return "1) 相手の意見の要点を要約 2) 同意/反対を明確に 3) 理由を一文で。" + speaker_hint
        else:
            return "1) 自分の主張を整理 2) 例または根拠を追加 3) 次の一歩を決めよう。" + speaker_hint
    
    else:  # ブロンズ
        if avg_length < 10:
            return "1) 感想を一文 2) 質問を一つ 3) 例を一つ。少しずつ慣れていこう！" + speaker_hint
        elif not has_questions:
            return "1) 相手の発言を引用 2) わかった点を書く 3) 気になる点を質問しよう。" + speaker_hint
        else:
            return "1) 主張→2) 理由→3) 例 の順で短く。最後に「よろしくお願いします」と添えよう。" + speaker_hint

def generate_fallback_advice(rank_name, avg_length):
    """Gemini APIが使用できない場合のフォールバックアドバイス（低ランクほど詳細、高ランクほど控えめ）"""
    if rank_name == "ダイヤモンド":
        if avg_length < 50:
            return "要点を1つに絞り、根拠を簡潔に。次の一手を短く示そう。"
        else:
            return "核心の論点を明確化し、短い示唆を1つだけ添えよう。"
    
    elif rank_name == "ゴールド":
        if avg_length < 30:
            return "主張+根拠を一文ずつ。最後に次の一手を簡潔に。"
        else:
            return "例を1つ添え、要点を2点に整理して相手へ質問を1つ。"
    
    elif rank_name == "シルバー":
        if avg_length < 20:
            return "1) 主張 2) 理由 3) 例 を順に。短くてもOK！"
        else:
            return "1) 要約 2) 自分の考え 3) 次に聞きたい質問、の3ステップで伝えよう。"
    
    else:  # ブロンズ
        if avg_length < 10:
            return "1) 感想 2) 質問 3) 例、の順で書いてみよう。少しずつできれば大丈夫！"
        else:
            return "1) 主張 2) 理由 3) 例 4) 質問、の4ステップで丁寧に進めよう。"
