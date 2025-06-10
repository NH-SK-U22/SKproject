import React from "react";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import StudentListComponent from "../../components/StudentList/StudentListComponent";
import styles from "./StudentList.module.css";

const StudentList = () => {
    return (
        <>
            <TeacherSidebar />
            <div className={styles.container}>
                <StudentListComponent />
            </div>
        </>
    );
};

export default StudentList; 