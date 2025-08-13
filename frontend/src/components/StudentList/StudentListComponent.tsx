import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StudentListComponent.module.css";

interface Student {
  id: number;
  class_id: string; // DBのclass_idを使う
  number: string;
  name: string;
  // rankはDBにあれば追加、なければsum_pointから算出
  sum_point?: number;
  rank?: string;
}

// 全角→半角変換
function toHankaku(str: string): string {
  return str.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );
}

// sum_pointからランク名を返す
function getRankName(sum_point: number): string {
  if (sum_point >= 2000) return "diamond";
  if (sum_point >= 1000) return "1st";
  if (sum_point >= 500) return "2nd";
  return "3rd";
}

const StudentListComponent = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("全クラス");
  const [sortType, setSortType] = useState("classAsc");
  const years = [1, 2, 3, 4, 5, 6];
  const classes = [1, 2];

  useEffect(() => {
    fetch("http://localhost:5000/api/students")
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortType(event.target.value);
  };

  // ランク画像の優先順位 diamond > 1st > 2nd > 3rd
  const getRankValue = (rank: string): number => {
    switch (rank) {
      case "diamond":
        return 0;
      case "1st":
        return 1;
      case "2nd":
        return 2;
      case "3rd":
        return 3;
      default:
        return 4;
    }
  };

  // ソート
  const sortStudents = (students: Student[]): Student[] => {
    return [...students].sort((a, b) => {
      switch (sortType) {
        case "classAsc": {
          const classComp = (a.class_id || "").localeCompare(b.class_id || "");
          if (classComp !== 0) return classComp;
          // クラスが同じ場合は出席番号（半角化して数値比較）
          return Number(toHankaku(a.number)) - Number(toHankaku(b.number));
        }
        case "classDesc": {
          const classComp = (b.class_id || "").localeCompare(a.class_id || "");
          if (classComp !== 0) return classComp;
          // クラスが同じ場合は出席番号（半角化して数値比較）
          return Number(toHankaku(a.number)) - Number(toHankaku(b.number));
        }
        case "rankAsc":
          return (
            getRankValue(getRankName(a.sum_point ?? 0)) -
            getRankValue(getRankName(b.sum_point ?? 0))
          );
        case "rankDesc":
          return (
            getRankValue(getRankName(b.sum_point ?? 0)) -
            getRankValue(getRankName(a.sum_point ?? 0))
          );
        case "numberAsc":
          return Number(toHankaku(a.number)) - Number(toHankaku(b.number));
        case "numberDesc":
          return Number(toHankaku(b.number)) - Number(toHankaku(a.number));
        default:
          return 0;
      }
    });
  };

  // クラスで絞り込み
  const filteredStudents =
    selectedClass === "全クラス"
      ? students
      : students.filter(
          (student) => toHankaku(student.class_id) === toHankaku(selectedClass)
        );
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
            {years.map((year) =>
              classes.map((classNum) => (
                <option
                  key={`${year}-${classNum}`}
                  value={`${year}年${classNum}組`}
                >
                  {year}年{classNum}組
                </option>
              ))
            )}
          </select>
        </div>
      </div>
      <div className={styles.down}>
        {sortedStudents.map((student) => (
          <div
            key={student.id}
            className={styles.Student}
            onClick={() => navigate(`/studentdata/${student.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.lclass}>{toHankaku(student.class_id)}</div>
            <div className={styles.lnumber}>{toHankaku(student.number)}番</div>
            <div className={styles.lname}>{student.name}</div>
            <div className={styles.llank}>
              <img
                src={`/images/${getRankName(student.sum_point ?? 0)}.png`}
                alt={getRankName(student.sum_point ?? 0)}
                className={styles.limg}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentListComponent;
