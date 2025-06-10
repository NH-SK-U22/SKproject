import React,{ useState } from "react";
import styles from "./StudentListComponent.module.css";


interface SampleData {
    class: string;
    number: number;
    name: string;
    lank: string;
}

const sampleData: SampleData[] = [
    // 1年1組
    { class: "1年1組", number: 1, name: "青木優花", lank: "diamond.png" },
    { class: "1年1組", number: 2, name: "石田大輝", lank: "1st.png" },
    { class: "1年1組", number: 3, name: "上田美咲", lank: "2nd.png" },
    { class: "1年1組", number: 4, name: "大野翔太", lank: "3rd.png" },
    { class: "1年1組", number: 5, name: "加藤莉子", lank: "diamond.png" },
    { class: "1年1組", number: 6, name: "佐藤健太", lank: "1st.png" },
    { class: "1年1組", number: 7, name: "鈴木花子", lank: "2nd.png" },
    { class: "1年1組", number: 8, name: "田中太郎", lank: "3rd.png" },
    { class: "1年1組", number: 9, name: "中村優子", lank: "diamond.png" },
    { class: "1年1組", number: 10, name: "野田和也", lank: "1st.png" },

    // 1年2組
    { class: "1年2組", number: 1, name: "安藤美咲", lank: "2nd.png" },
    { class: "1年2組", number: 2, name: "伊藤健太", lank: "diamond.png" },
    { class: "1年2組", number: 3, name: "井上優子", lank: "1st.png" },
    { class: "1年2組", number: 4, name: "江口翔太", lank: "3rd.png" },
    { class: "1年2組", number: 5, name: "大塚莉子", lank: "2nd.png" },
    { class: "1年2組", number: 6, name: "岡田和也", lank: "diamond.png" },
    { class: "1年2組", number: 7, name: "金子花子", lank: "1st.png" },
    { class: "1年2組", number: 8, name: "川口太郎", lank: "3rd.png" },
    { class: "1年2組", number: 9, name: "木村優花", lank: "2nd.png" },
    { class: "1年2組", number: 10, name: "久保大輝", lank: "diamond.png" },

    // 2年1組
    { class: "2年1組", number: 1, name: "青木優花", lank: "1st.png" },
    { class: "2年1組", number: 2, name: "石田大輝", lank: "diamond.png" },
    { class: "2年1組", number: 3, name: "上田美咲", lank: "3rd.png" },
    { class: "2年1組", number: 4, name: "大野翔太", lank: "2nd.png" },
    { class: "2年1組", number: 5, name: "加藤莉子", lank: "1st.png" },
    { class: "2年1組", number: 6, name: "佐藤健太", lank: "diamond.png" },
    { class: "2年1組", number: 7, name: "鈴木花子", lank: "3rd.png" },
    { class: "2年1組", number: 8, name: "田中太郎", lank: "2nd.png" },
    { class: "2年1組", number: 9, name: "中村優子", lank: "1st.png" },
    { class: "2年1組", number: 10, name: "野田和也", lank: "diamond.png" },

    // 2年2組
    { class: "2年2組", number: 1, name: "安藤美咲", lank: "3rd.png" },
    { class: "2年2組", number: 2, name: "伊藤健太", lank: "2nd.png" },
    { class: "2年2組", number: 3, name: "井上優子", lank: "diamond.png" },
    { class: "2年2組", number: 4, name: "江口翔太", lank: "1st.png" },
    { class: "2年2組", number: 5, name: "大塚莉子", lank: "3rd.png" },
    { class: "2年2組", number: 6, name: "岡田和也", lank: "2nd.png" },
    { class: "2年2組", number: 7, name: "金子花子", lank: "diamond.png" },
    { class: "2年2組", number: 8, name: "川口太郎", lank: "1st.png" },
    { class: "2年2組", number: 9, name: "木村優花", lank: "3rd.png" },
    { class: "2年2組", number: 10, name: "久保大輝", lank: "2nd.png" },

    // 3年1組
    { class: "3年1組", number: 1, name: "青木優花", lank: "diamond.png" },
    { class: "3年1組", number: 2, name: "石田大輝", lank: "1st.png" },
    { class: "3年1組", number: 3, name: "上田美咲", lank: "2nd.png" },
    { class: "3年1組", number: 4, name: "大野翔太", lank: "3rd.png" },
    { class: "3年1組", number: 5, name: "加藤莉子", lank: "diamond.png" },
    { class: "3年1組", number: 6, name: "佐藤健太", lank: "1st.png" },
    { class: "3年1組", number: 7, name: "鈴木花子", lank: "2nd.png" },
    { class: "3年1組", number: 8, name: "田中太郎", lank: "3rd.png" },
    { class: "3年1組", number: 9, name: "中村優子", lank: "diamond.png" },
    { class: "3年1組", number: 10, name: "野田和也", lank: "1st.png" },

    // 3年2組
    { class: "3年2組", number: 1, name: "安藤美咲", lank: "2nd.png" },
    { class: "3年2組", number: 2, name: "伊藤健太", lank: "diamond.png" },
    { class: "3年2組", number: 3, name: "井上優子", lank: "1st.png" },
    { class: "3年2組", number: 4, name: "江口翔太", lank: "3rd.png" },
    { class: "3年2組", number: 5, name: "大塚莉子", lank: "2nd.png" },
    { class: "3年2組", number: 6, name: "岡田和也", lank: "diamond.png" },
    { class: "3年2組", number: 7, name: "金子花子", lank: "1st.png" },
    { class: "3年2組", number: 8, name: "川口太郎", lank: "3rd.png" },
    { class: "3年2組", number: 9, name: "木村優花", lank: "2nd.png" },
    { class: "3年2組", number: 10, name: "久保大輝", lank: "diamond.png" },

    // 4年1組
    { class: "4年1組", number: 1, name: "青木優花", lank: "1st.png" },
    { class: "4年1組", number: 2, name: "石田大輝", lank: "diamond.png" },
    { class: "4年1組", number: 3, name: "上田美咲", lank: "3rd.png" },
    { class: "4年1組", number: 4, name: "大野翔太", lank: "2nd.png" },
    { class: "4年1組", number: 5, name: "加藤莉子", lank: "1st.png" },
    { class: "4年1組", number: 6, name: "佐藤健太", lank: "diamond.png" },
    { class: "4年1組", number: 7, name: "鈴木花子", lank: "3rd.png" },
    { class: "4年1組", number: 8, name: "田中太郎", lank: "2nd.png" },
    { class: "4年1組", number: 9, name: "中村優子", lank: "1st.png" },
    { class: "4年1組", number: 10, name: "野田和也", lank: "diamond.png" },

    // 4年2組
    { class: "4年2組", number: 1, name: "安藤美咲", lank: "3rd.png" },
    { class: "4年2組", number: 2, name: "伊藤健太", lank: "2nd.png" },
    { class: "4年2組", number: 3, name: "井上優子", lank: "diamond.png" },
    { class: "4年2組", number: 4, name: "江口翔太", lank: "1st.png" },
    { class: "4年2組", number: 5, name: "大塚莉子", lank: "3rd.png" },
    { class: "4年2組", number: 6, name: "岡田和也", lank: "2nd.png" },
    { class: "4年2組", number: 7, name: "金子花子", lank: "diamond.png" },
    { class: "4年2組", number: 8, name: "川口太郎", lank: "1st.png" },
    { class: "4年2組", number: 9, name: "木村優花", lank: "3rd.png" },
    { class: "4年2組", number: 10, name: "久保大輝", lank: "2nd.png" },

    // 5年1組
    { class: "5年1組", number: 1, name: "青木優花", lank: "diamond.png" },
    { class: "5年1組", number: 2, name: "石田大輝", lank: "1st.png" },
    { class: "5年1組", number: 3, name: "上田美咲", lank: "2nd.png" },
    { class: "5年1組", number: 4, name: "大野翔太", lank: "3rd.png" },
    { class: "5年1組", number: 5, name: "加藤莉子", lank: "diamond.png" },
    { class: "5年1組", number: 6, name: "佐藤健太", lank: "1st.png" },
    { class: "5年1組", number: 7, name: "鈴木花子", lank: "2nd.png" },
    { class: "5年1組", number: 8, name: "田中太郎", lank: "3rd.png" },
    { class: "5年1組", number: 9, name: "中村優子", lank: "diamond.png" },
    { class: "5年1組", number: 10, name: "野田和也", lank: "1st.png" },

    // 5年2組
    { class: "5年2組", number: 1, name: "安藤美咲", lank: "2nd.png" },
    { class: "5年2組", number: 2, name: "伊藤健太", lank: "diamond.png" },
    { class: "5年2組", number: 3, name: "井上優子", lank: "1st.png" },
    { class: "5年2組", number: 4, name: "江口翔太", lank: "3rd.png" },
    { class: "5年2組", number: 5, name: "大塚莉子", lank: "2nd.png" },
    { class: "5年2組", number: 6, name: "岡田和也", lank: "diamond.png" },
    { class: "5年2組", number: 7, name: "金子花子", lank: "1st.png" },
    { class: "5年2組", number: 8, name: "川口太郎", lank: "3rd.png" },
    { class: "5年2組", number: 9, name: "木村優花", lank: "2nd.png" },
    { class: "5年2組", number: 10, name: "久保大輝", lank: "diamond.png" },

    // 6年1組
    { class: "6年1組", number: 1, name: "青木優花", lank: "1st.png" },
    { class: "6年1組", number: 2, name: "石田大輝", lank: "diamond.png" },
    { class: "6年1組", number: 3, name: "上田美咲", lank: "3rd.png" },
    { class: "6年1組", number: 4, name: "大野翔太", lank: "2nd.png" },
    { class: "6年1組", number: 5, name: "加藤莉子", lank: "1st.png" },
    { class: "6年1組", number: 6, name: "佐藤健太", lank: "diamond.png" },
    { class: "6年1組", number: 7, name: "鈴木花子", lank: "3rd.png" },
    { class: "6年1組", number: 8, name: "田中太郎", lank: "2nd.png" },
    { class: "6年1組", number: 9, name: "中村優子", lank: "1st.png" },
    { class: "6年1組", number: 10, name: "野田和也", lank: "diamond.png" },

    // 6年2組
    { class: "6年2組", number: 1, name: "安藤美咲", lank: "3rd.png" },
    { class: "6年2組", number: 2, name: "伊藤健太", lank: "2nd.png" },
    { class: "6年2組", number: 3, name: "井上優子", lank: "diamond.png" },
    { class: "6年2組", number: 4, name: "江口翔太", lank: "1st.png" },
    { class: "6年2組", number: 5, name: "大塚莉子", lank: "3rd.png" },
    { class: "6年2組", number: 6, name: "岡田和也", lank: "2nd.png" },
    { class: "6年2組", number: 7, name: "金子花子", lank: "diamond.png" },
    { class: "6年2組", number: 8, name: "川口太郎", lank: "1st.png" },
    { class: "6年2組", number: 9, name: "木村優花", lank: "3rd.png" },
    { class: "6年2組", number: 10, name: "久保大輝", lank: "2nd.png" }
];


const StudentListComponent = () => {
    const [selectedClass, setSelectedClass] = useState("全クラス");
    const [sortType, setSortType] = useState("classAsc");
    const years = [1, 2, 3, 4, 5, 6];
    const classes = [1, 2];

    const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedClass(event.target.value);
    };
    
    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortType(event.target.value);
    };

    const getRankValue = (lank: string): number => {
        switch(lank) {
            case "diamond.png": return 0;
            case "1st.png": return 1;
            case "2nd.png": return 2;
            case "3rd.png": return 3;
            default: return 4;
        }
    };

    const sortStudents = (students: SampleData[]) => {
        return [...students].sort((a, b) => {
            switch(sortType) {
                case "classAsc":
                    return a.class.localeCompare(b.class);
                case "classDesc":
                    return b.class.localeCompare(a.class);
                case "rankAsc":
                    return getRankValue(a.lank) - getRankValue(b.lank);
                case "rankDesc":
                    return getRankValue(b.lank) - getRankValue(a.lank);
                case "numberAsc":
                    return a.number - b.number;
                case "numberDesc":
                    return b.number - a.number;
                default:
                    return 0;
            }
        });
    };
    
    const filteredStudents = selectedClass === "全クラス" 
        ? sampleData 
        : sampleData.filter(student => student.class === selectedClass);
    const sortedStudents = sortStudents(filteredStudents);

    return (
        <div className={styles.container}>
            <div className={styles.up}>
                <div className={styles.sort}>
                    <select 
                        value={sortType} 
                        onChange={handleSortChange}
                        className={styles.sortSelect}
                    >
                        <option value="classAsc">クラス昇順</option>
                        <option value="classDesc">クラス降順</option>
                        <option value="rankAsc">ランク昇順</option>
                        <option value="rankDesc">ランク降順</option>
                        <option value="numberAsc">出席番号昇順</option>
                        <option value="numberDesc">出席番号降順</option>
                    </select>
                </div>
                <div className={styles.StudentList}>
                    <p>生徒一覧</p>
                </div>
                <div className={styles.class}>
                    <select 
                        value={selectedClass} 
                        onChange={handleClassChange}
                        className={styles.classSelect}
                    >
                        <option value="全クラス">全クラス</option>
                        {years.map(year => (
                            classes.map(classNum => (
                                <option key={`${year}-${classNum}`} value={`${year}年${classNum}組`}>
                                    {year}年{classNum}組
                                </option>
                            ))
                        ))}
                    </select>
                </div>
            </div>
            <div className={styles.down}>
                {sortedStudents.map((number,index) => (
                  <a href="" key={index}>
                    <div className={styles.Student}>
                      <div className={styles.lclass}>{number.class}</div>
                      <div className={styles.lnumber}>{number.number}番</div>
                      <div className={styles.lname}>{number.name}</div>
                      <div className={styles.llank}>
                        <img src={`/images/${number.lank}`} alt={number.lank} className={styles.limg}/>
                      </div>
                    </div>
                  </a>
                ))}
            </div>
        </div>
    );
};

export default StudentListComponent;