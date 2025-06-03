import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import StudentListComponent from "../../components/StudentList/StudentListComponent";
import styles from "./StudentList.module.css";

const StudentList = () => {
    return (
        <>
            <Sidebar />
            <div className={styles.container}>
                <StudentListComponent />
            </div>
        </>
    );
};

export default StudentList; 