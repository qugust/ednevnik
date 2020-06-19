# eDnevnik

E-Dnevnik Unofficial API

## Instalacija / Installation

```bash
$ npm install ednevnik
```

## Upotreba / Usage

```javascript
const eDnevnik = require('ednevnik').default;

// Typescript: import eDnevnik from 'ednevnik';

const dnevnik = new eDnevnik("email@skole.hr", "password");

await dnevnik.login();

const classes = await dnevnik.fetchClasses();
// => [{
// =>   id: '314901233',
// =>   name: '1.a',
// =>   info: 'Školska godina 2014./2015.\nXV. gimnazija, Zagreb\nRazrednik: Ivan Ivić',
// =>   average: 'Vrlo dobar (3.89)'
// => }]

const courses = await dnevnik.fetchCourses(classId);
// => [{
// =>   courseId: '314450111',
// =>   subId: '2441156290',
// =>   name: 'Hrvatski jezik',
// =>   info: 'Ivan Ivić'
// => }]

const courseDetails = await dnevnik.fetchCourseDetails(courseId, subId);
// => {
// =>   grades: [{
// =>     grade: '4',
// =>     info: 'Lektira: A. G. Matoš, Camao',
// =>     date: '11.02.2015.'
// =>   }],
// =>   notes: [{
// =>     info: 'Kratka pisana provjera znanja 5',
// =>     date: '02.02.2015.'
// =>   }],
// => }

const exams = await dnevnik.fetchExams(classId);
// => [{
// =>   course: 'Hrvatski jezik',
// =>   info: 'Prva pisana provjera znanja',
// =>   date: '15.4.2015.'
// => }]

const absences = await dnevnik.fetchAbsences(classId);
// => [{
// =>   date: 'Četvrtak 03.03.2015.',
// =>   period: '7.',
// =>   course: 'Engleski jezik',
// =>   status: 'Opravdano',
// =>   reason: 'Opravdao roditelj',
// => }]

const studentInfo = await dnevnik.fetchStudentInfo(classId);
// => [{
// =>   ordinal: '15',
// =>   fullName: 'Pero Perić',
// =>   OIB: '01234567890',
// =>   DOB: '23.05.2000',
// =>   POB: 'Grad Zagreb, Hrvatska',
// =>   mOIB: '0000/XXV',
// =>   address: 'Ilica 12, Grad Zagreb',
// =>   program: 'Opća gimnazija',
// => }]

const studentNotes = await dnevnik.fetchStudentNotes(classId);
// => [{
// =>   classmasterNotes: 'Nema bilježaka razrednika!',
// =>   ecActivities: 'Dramska skupina',
// =>   osActivities: 'Boksački klub',
// =>   manners: 'Cijela godina: loše',
// =>   pedagogicalMeasures: [{
// =>     type: 'Ukor',
// =>     info: 'Pedagoška mjera izriče se učeniku zbog kršenja Pravilnika o ponašanju.',
// =>     date: '2012-02-09'
// =>   }],
// => }]
```

## Održavatelj / Maintainer

[![qugust](https://github.com/qugust.png?size=100)](https://qugust.com/)

## Licenca / License
[MIT](https://choosealicense.com/licenses/mit/)