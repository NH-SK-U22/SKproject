import React from "react";
import styles from "./StudentListComponent.module.css";


interface SampleData {
    class: string;
    number: number;
    name: string;
}

const sampleData: SampleData[] = [
    {
        class: "3年2組",
        number: 1,
        name: "青山大翔"
    },
    {
        class: "3年2組",
        number: 2,
        name: "井上幸助"
    },
    {
        class: "3年2組",
        number: 3,
        name: "加藤紗枝"
    },
    {
        class: "3年2組",
        number: 4,
        name: "清水宗佑"
    },
    {
        class: "3年2組",
        number: 5,
        name: "野口萌"
    },
    {
        class: "3年2組",
        number: 6,
        name: "渡辺水樹"
    },
    {
        class: "3年2組",
        number: 1,
        name: "青山大翔"
    },
    {
        class: "3年2組",
        number: 2,
        name: "井上幸助"
    },
    {
        class: "3年2組",
        number: 3,
        name: "加藤紗枝"
    },
    {
        class: "3年2組",
        number: 4,
        name: "清水宗佑"
    },
    {
        class: "3年2組",
        number: 5,
        name: "野口萌"
    },
    {
        class: "3年2組",
        number: 6,
        name: "渡辺水樹"
    },
];


const StudentListComponent = () => {
    return (
        <div className={styles.container}>
            <div className={styles.up}>
                <div className={styles.StudentList}>
                    <p>生徒一覧</p>
                </div>
                <div className={styles.class}>
                    <p>〇年〇組</p>
                </div>
            </div>
            <div className={styles.down}>
                {sampleData
                    .map((number,index) => (
                        <a href="">
                            <div key={index} className={styles.Student}>
                                <div className={styles.lclass}>{number.class}</div>
                                <div className={styles.lnumber}>{number.number}番</div>
                                <div className={styles.lname}>{number.name}</div>
                            </div>
                        </a>
                    ))
                }
            </div>
        </div>
    );
};

export default StudentListComponent;