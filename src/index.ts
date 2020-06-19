import got from 'got';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';

interface StudentClass {
    id: number;
    name: string;
    info: string;
    average: string;
}

interface Course {
    courseId: number;
    subId: number;
    name: string;
    info: string;
}

interface CourseDetails {
    grades: Grade[];
    notes: Note[];
}

interface Grade extends Note {
    grade: string;
}

interface Note {
    info: string;
    date: string;
}

interface Exam {
    course: string;
    info: string;
    date: string;
}

interface Absence {
    date: string;
    period: string;
    course: string;
    status: string;
    reason: string;
}

interface StudentInfo {
    ordinal: string;
    fullName: string;
    OIB: string;
    DOB: string;
    POB: string;
    mOIB: string;
    address: string;
    program: string;
}

interface PedagogicalMeasures {
    type: string;
    info: string;
    date: string;
}

interface StudentNotes {
    classmasterNotes: string;
    ecActivities: string;
    osActivities: string;
    manners: string;
    pedagogicalMeasures: PedagogicalMeasures[];
}

class eDnevnik {
    email: string;
	password: string;
	jar: CookieJar;
	csrfToken: string;

	constructor(
		email: string,
		password: string,
	) {
		Object.assign(this, {
			email,
			password,
			jar: new CookieJar(),
			csrfToken: null,
		});
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private extractCsrf(headers: object) {
		return headers.toString().split('csrf_cookie=')[1].split(";")[0];
	}
	
	private capitalizeFirstLetter(string: string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private async apiRequest(endpoint: string, form: object = null) {
		try {
			const res = await got(`https://ocjene.skole.hr${endpoint}`, {
				headers: {
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
					"Accept-Encoding": "gzip, deflate, br",
					"Accept-Language": "en-US,en;q=0.9",
					"Connection": "keep-alive",
					"Host": "ocjene.skole.hr",
					"Sec-Fetch-Dest": "document",
					"Sec-Fetch-Mode": "navigate",
					"Sec-Fetch-Site": "none",
					"Upgrade-Insecure-Requests": "1",
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36",
				},
				cookieJar: this.jar,
				method: form ? "POST" : "GET",
				form: form ? form : undefined,
			});
			this.csrfToken = this.extractCsrf(res.headers['set-cookie']);
			return res;
		} catch (e) {
			throw new Error(e);
		}
	}

	async login(): Promise<void> {
		try {
			await this.apiRequest("/pocetna/prijava");
			const { body } = await this.apiRequest("/pocetna/posalji/", {
				csrf_token: this.csrfToken,
				user_login: this.email,
				user_password: this.password,
			});
			if (body.includes("Krivo korisničko ime i/ili lozinka")) throw new Error("Wrong email and/or password");
		} catch (e) {
			throw new Error("Failed to login.");
		}
	}

	async fetchClasses(): Promise<StudentClass[]> {
		try {
			const { body } = await this.apiRequest("/razredi/odabir");
			const $ = cheerio.load(body);
			const classes: StudentClass[] = [];
			$('.class-wrap').each((i, c) => {
				classes.push({
					id: parseInt($(c).attr("href").split("/").pop()),
					name: $(c).children('.class').children('.school-class').text(),
					info: $(c).children('.class').text().substr(3).replace("Razrednik", "\nRazrednik").replace(/(\d{4}\.\/\d{4}\.)/, "$1\n"),
					average: $(c).children('.overall-score').text().replace("Opći uspjeh:", ""),
				});
			});
			return classes;
		} catch (e) {
			throw new Error("Failed to fetch Class Years");
		}
	}

	async fetchCourses(classId: number): Promise<Course[]> {
		try {
			const { body } = await this.apiRequest(`/pregled/predmeti/${classId}`);
			const $ = cheerio.load(body);
			const courses: Course[] = [];
			$('#courses').children("a").each((i, c) => {
				const ids = $(c).attr("href").split("/");
				const subId = ids.pop();
				const id = ids.pop();
				courses.push({
					courseId: parseInt(id),
					subId: parseInt(subId),
					name: this.capitalizeFirstLetter($(c).attr("name").replace("-", " ")),
					info: $(c).children(".course").children(".course-info").text(),
				});
			});
			return courses;
		} catch (e) {
			throw new Error("Failed to fetch Courses");
		}
	}

    async fetchCourseDetails(courseId: number, subId: number): Promise<CourseDetails> {
		try {
			const { body } = await this.apiRequest(`/pregled/predmet/${courseId}/${subId}`);
			const $ = cheerio.load(body);
			const details: CourseDetails = {
                grades: [],
                notes: [],
            };
			$('#grade_notes > tbody').children("tr").each((i, c) => {
                if (i % 2 === 0) return;
				details.grades.push({
                    grade: $(c).children('.ocjena').text(),
					info: $(c).children('.biljeska').text(),
					date: $(c).children('.datum').text(),
				});
            });
            $('#notes > tbody').children("tr").each((i, c) => {
                if (i % 2 === 0) return;
                const tds = [];
                $(c).children('td').each((i, c) => {
                    tds.push($(c).text());
                });
				details.notes.push({
					info: tds[1],
					date: tds[0],
				});
			});
			return details;
		} catch (e) {
			throw new Error("Failed to fetch Course Details");
		}
	}

	async fetchExams(classId: number): Promise<Exam[]> {
		try {
			const { body } = await this.apiRequest(`/pregled/ispiti/${classId}/all`);
			const $ = cheerio.load(body);
			const exams = [];
			$('tr').each((i, c) => {
				if (i === 0 || (i % 2 === 0)) return;
				const ths = [];
				$(c).children("td").each((i, c) => {
					ths.push($(c).text());
				});
				exams.push({
					course: ths[0],
					info: ths[1],
					date: ths[2],
				});
			});
			return exams;
		} catch (e) {
			throw new Error("Failed to fetch Exams");
		}
	}

	async fetchAbsences(classId: number): Promise<Absence[]> {
		try {
			const { body } = await this.apiRequest(`/pregled/izostanci/${classId}`);
			const $ = cheerio.load(body);
			const absences = [];
			let date;
			$("#absent > div.hours > table > tbody").children('tr').each((i, c) => {
				let trs = [];
				$(c).children("td").each((i, c) => {
					trs.push($($(c).children()[0]).attr("alt") ? $($(c).children()[0]).attr("alt") : $(c).text());
				});
				if (trs.length === 4) {
					trs = [date, ...trs];
				} else {
					date = trs[0];
				}
				absences.push({
					date: trs[0].replace(/(\w+)(\d{2}\.\d{2}\.\d{4})/, "$1 $2"),
					period: trs[1],
					course: trs[2],
					status: trs[3],
					reason: trs[4],
				});
			});
			return absences;
		} catch (e) {
			throw new Error("Failed to fetch Absences");
		}
	}

	async fetchStudentInfo(classId: number): Promise<StudentInfo> {
		try {
			const { body } = await this.apiRequest(`/pregled/osobni_podaci/${classId}`);
			const $ = cheerio.load(body);
			const trs = [];
			$("#content > div:nth-child(4) > div > table > tbody").children('tr').each((i, c) => {
				trs.push($($(c).children("td")[0]).text());
			});
			return {
				ordinal: trs[0],
				fullName: trs[1],
				OIB: trs[2],
				DOB: trs[3],
				POB: trs[4],
                mOIB: trs[5],
                address: trs[6],
                program: trs[7],
			};
		} catch (e) {
			throw new Error("Failed to fetch Student Info");
		}
    }
    
    async fetchStudentNotes(classId: number): Promise<StudentNotes> {
		try {
			const { body } = await this.apiRequest(`/pregled/biljeske/${classId}`);
            const $ = cheerio.load(body);
            const classmasterNotes = $("#content > div:nth-child(7) > div").text();
            const ecActivities = $("#content > div:nth-child(10) > div").text();
            const osActivities = $("#content > div:nth-child(13) > div").text();
            const pedagogicalMeasures = [];
            if ($("#content > div:nth-child(19) > table > tbody")) {
                $("#content > div:nth-child(19) > table > tbody").children('tr').each((i, c) => {
                    if (i < 2) return;
                    const tds = [];
                    $(c).children('td').each((i, c) => {
                        tds.push($(c).text());
                    });
                    pedagogicalMeasures.push({
                        type: tds[0],
                        info: tds[1],
                        date: tds[2],
                    });
                });
            }
			return {
				classmasterNotes: classmasterNotes !== "Nema bilježaka razrednika!" ? classmasterNotes : null,
				ecActivities: ecActivities !== "Nema zabilježenih izvannastavnih školskih aktivnosti!" ? ecActivities : null,
				osActivities: osActivities !== "Nema zabilježenih izvanškolskih aktivnosti!" ? osActivities : null,
				manners: $("#content > div:nth-child(16) > div").text(),
                pedagogicalMeasures: pedagogicalMeasures,
			};
		} catch (e) {
			throw new Error("Failed to fetch Student Notes");
		}
	}
}

export default eDnevnik;