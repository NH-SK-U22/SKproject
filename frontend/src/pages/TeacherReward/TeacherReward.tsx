import React from "react";
import Reward from "../Reward/Reward";
import TeacherRewardComponent from "../../components/TeacherReward/TeacherRewardComponent";
import styles from "./TeacherReward.module.css";

const TeacherReward = () => {
    return (
        <>
            <Reward />
            <TeacherRewardComponent />
        </>
    );
};

export default TeacherReward;