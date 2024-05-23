import React from 'react';
import Background from '../../visualComponents/Background';
import { useTranslation } from 'react-i18next';

const TeacherPDF = ({ paramStudents, paramWords }) => {
    const { t } = useTranslation();

    const generateFakeStudents = () => {
        const students = [];
        for (let i = 1; i <= 36; i++) {
            students.push({
                id: i,
                name: `estudiante ${i}`,
                score: Math.floor(Math.random() * 100) + 1 // Random score between 1 and 100
            });
        }
        return students;
    };

    const students = paramStudents || generateFakeStudents();

    const generateFakeWords = () => {
        const words = [];
        for (let i = 1; i <= 10; i++) {
            words.push({
                id: i,
                name: `palabra`,
                times: Math.floor(Math.random() * 100) + 1 // Random score between 1 and 100
            });
        }
        return words;
    };

    const words = paramWords || generateFakeWords();

    const distributeStudentsIntoColumns = (students, columns) => {
        const studentsPerColumn = Math.ceil(students.length / columns);
        const distributedStudents = [];

        for (let i = 0; i < columns; i++) {
            distributedStudents.push(students.slice(i * studentsPerColumn, (i + 1) * studentsPerColumn));
        }

        return distributedStudents;
    };

    const displayedStudents = students.slice(0, students.length > 36 ? 35 : 36);
    const additionalStudentsCount = students.length > 36 ? students.length - 35 : 0;

    const columns = distributeStudentsIntoColumns(displayedStudents, 3);

    return (
        <Background>
            <div>
                <div className="inside-card-pdf">
                    <div className='grid grid-cols-3 w-full h-full'>
                        <div className='grid grid-rows-5 col-span-2'>
                            <h1>Resultados</h1>
                            <div className='row-span-4 grid grid-cols-3 student-list-pdf mb-10 ml-3 mr-9'>
                                {columns.map((column, colIndex) => (
                                    <div key={colIndex} className='flex flex-col'>
                                        {column.map((student, index) => (
                                            <div key={student.id} className='student-item see-score adjust-text'>
                                                <span>
                                                    <a> {index + 1 + colIndex * Math.ceil(displayedStudents.length / columns.length)}.</a> {student.name.length > 13 ? student.name.substring(0, 13) + "..." : student.name}
                                                    &nbsp;({student.score}%)
                                                </span>
                                            </div>
                                        ))}
                                        {colIndex === columns.length - 1 && additionalStudentsCount > 0 && (
                                            <div className='student-item see-score'>
                                                <span>...{additionalStudentsCount} more</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ height: '2rem' }}> </div>
                            <div className='inside-card-2-header-pdf text-white pb-7'> {/*Header*/}
                                <div> {t('mostErrors')}</div>
                            </div>
                            <div className="inside-card-2-pdf p-6 pt-20">
                                <ul className='pt-1'>
                                    {words.slice(0, 10).map((word, index) => (
                                        <li key={word.id} className='student-item see-score'>
                                            <div className='grid grid-cols-2 gap-0.5'>
                                                <div className="col-span-1">
                                                    <span>
                                                        {word.name.length > 16 ? word.name.substring(0, 16) + "..." : word.name}
                                                    </span>
                                                </div>

                                                <div className={`col-span-1 flex items-center justify-start md:justify-end lg:justify-end pr-0 md:pr-3 lg:pr-3`}>
                                                    <div>
                                                        3 veces
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className='h-28 text-center content-center text-4xl pb-7'>
                                Hiatus &#169; /
                                ABC123
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Background>
    );
};

export default TeacherPDF;
