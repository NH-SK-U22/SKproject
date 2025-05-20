const SelectUser = () => {
  return (
    <div className="container">
      <h1>Select User</h1>
      <div className="typeSelect">
        <button>
          <img src={studentImg} alt="student" />
          <span>Student</span>
        </button>
        <button>
          <img src={teacherImg} alt="teacher" />
          <span>Teacher</span>
        </button>
      </div>
    </div>
  );
};

export default SelectUser;
