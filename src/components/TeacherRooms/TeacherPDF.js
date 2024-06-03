import React from 'react';
import Background from '../../visualComponents/Background';
import { useTranslation } from 'react-i18next';
import { getFromSessionStorage } from '../../utils/storageUtils';

const TeacherPDF = ({ paramStudents, paramWords }) => {
    const { t } = useTranslation();

    const generateFakeStudents = () => {
        const students = [];
        for (let i = 1; i <= 47; i++) {
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

    const displayedStudents = students.slice(0, students.length > 36 ? 35 : 36);
    const additionalStudentsCount = students.length > 36 ? students.length - 35 : 0;
    const classCode = getFromSessionStorage('createdClassCode') || '';

    return (
        <Background>
            <div>
                <div className="inside-card-pdf">
                    <div className='grid grid-cols-11 w-full h-full'>
                        <div className='col-span-8'>
                            <h1>{t('results')} {classCode} </h1>
                            <div className='grid grid-cols-3 gap-0.5 student-list-pdf mb-10 mt-10 ml-3 mr-9'>
                                {displayedStudents.map((student, index) => (
                                    <div key={student.id} className='student-item see-score adjust-text'>
                                        <span>
                                            <span style={{ fontWeight: 'bold' }} className={`resultsStudent${index + 1}`}> {index + 1}.</span>
                                            &nbsp;{student.name.length > 13 ? student.name.substring(0, 13) + "..." : student.name}
                                            &nbsp;({student.score}%)
                                        </span>
                                    </div>
                                ))}
                                {additionalStudentsCount > 0 && (
                                    <div className='student-item see-score'>
                                        <span>...{additionalStudentsCount} more</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='pt-6 col-span-3'>
                            <div style={{ height: '2rem' }}> </div>
                            <div className='inside-card-2-header-pdf text-white pl-9'> {/*Header*/}
                                <div className='move-up-pdf'> {t('mostErrors')}</div>
                            </div>
                            <div className="inside-card-2-pdf pl-9 pr-8 pt-0">
                                <ul>
                                    {words.slice(0, 10).map((word, index) => (
                                        <li key={word.id} className='student-item see-score'>
                                            <div className='grid grid-cols-2 gap-0.5'>
                                                <div className="col-span-1">
                                                    <span>
                                                        {word.name.length > 16 ? word.name.substring(0, 16) + "..." : word.name}
                                                    </span>
                                                </div>

                                                <div className="col-span-1 flex items-center justify-end pr-3">
                                                    <div>
                                                        {word.times} {word.times > 1 ? t('times') : t('time')}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* <div className='h-28 text-center content-center text-4xl pb-7'>
                                Hiatus &#169; /
                                ABC123
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </Background>
    );
};

export default TeacherPDF;
