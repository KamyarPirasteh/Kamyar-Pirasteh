// =====================================
// تنظیمات اولیه
// =====================================

const addProjectButton = document.getElementById("add-project");

const projectFileInput = document.getElementById("project-file");

const projectImageInput = document.getElementById("project-image");

const projectsGrid = document.getElementById("projects-grid");

const projectCount = document.getElementById("project-count");

const noteInput = document.getElementById("note-input");

const addNoteButton = document.getElementById("add-note");

const notesGrid = document.getElementById("notes-grid");

let selectedProjectFile = null;


// =====================================
// ساخت پایگاه داده مرورگر
// =====================================

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open("KamyarProjectsDB", 1);

        request.onupgradeneeded = function (event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("projects")) {

                db.createObjectStore("projects", {
                    keyPath: "id",
                    autoIncrement: true
                });

            }

        };

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };

    });

}


// =====================================
// ذخیره پروژه
// =====================================

async function saveProject(project) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "projects",
            "readwrite"
        );

        const store = transaction.objectStore("projects");

        const request = store.add(project);

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };

        transaction.oncomplete = function () {
            db.close();
        };

    });

}


// =====================================
// دریافت همه پروژه‌ها
// =====================================

async function getAllProjects() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "projects",
            "readonly"
        );

        const store = transaction.objectStore("projects");

        const request = store.getAll();

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };

        transaction.oncomplete = function () {
            db.close();
        };

    });

}


// =====================================
// حذف پروژه
// =====================================

async function deleteProject(id) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "projects",
            "readwrite"
        );

        const store = transaction.objectStore("projects");

        const request = store.delete(id);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(request.error);
        };

        transaction.oncomplete = function () {
            db.close();
        };

    });

}


// =====================================
// ساخت کارت پروژه
// =====================================

function createProjectCard(project) {

    const card = document.createElement("article");

    card.className = "project-card";


    // دکمه باز کردن پروژه

    const openButton = document.createElement("button");

    openButton.type = "button";

    openButton.className = "project-open";

    openButton.title = "دریافت فایل پروژه";


    // تصویر پروژه

    const image = document.createElement("img");

    image.className = "project-cover";

    image.alt = project.title;

    image.src = URL.createObjectURL(project.image);


    // اطلاعات پروژه

    const details = document.createElement("span");

    details.className = "project-details";


    const title = document.createElement("span");

    title.className = "project-title";

    title.textContent = project.title;


    const type = document.createElement("span");

    type.className = "project-type";

    type.textContent = project.file.name.split(".").pop().toUpperCase();


    details.append(title, type);

    openButton.append(image, details);


    // کلیک روی کارت

    openButton.addEventListener("click", function () {

        downloadProject(project);

    });


    // دکمه‌های پایین کارت

    const actions = document.createElement("div");

    actions.className = "project-actions";


    const downloadButton = document.createElement("button");

    downloadButton.type = "button";

    downloadButton.className = "download-button";

    downloadButton.textContent = "دریافت فایل";


    downloadButton.addEventListener("click", function () {

        downloadProject(project);

    });


    const deleteButton = document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className = "delete-button";

    deleteButton.textContent = "حذف";


    deleteButton.addEventListener("click", async function () {

        const confirmed = confirm(
            `آیا می‌خواهی پروژه «${project.title}» حذف شود؟`
        );

        if (!confirmed) {
            return;
        }

        try {

            await deleteProject(project.id);

            await renderProjects();

        } catch (error) {

            console.error(error);

            alert("حذف پروژه انجام نشد.");

        }

    });


    actions.append(downloadButton, deleteButton);

    card.append(openButton, actions);

    return card;

}


// =====================================
// دریافت فایل پروژه
// =====================================

function downloadProject(project) {

    const url = URL.createObjectURL(project.file);

    const link = document.createElement("a");

    link.href = url;

    link.download = project.file.name;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

}


// =====================================
// نمایش پروژه‌ها
// =====================================

async function renderProjects() {

    const projects = await getAllProjects();

    // دکمه افزودن را نگه می‌داریم.

    projectsGrid.replaceChildren(addProjectButton);


    projects.forEach(function (project) {

        const card = createProjectCard(project);

        projectsGrid.appendChild(card);

    });


    // شمارش پروژه‌ها

    const count = projects.length;

    projectCount.textContent = `${count.toLocaleString("fa-IR")} پروژه`;

}


// =====================================
// انتخاب فایل پروژه
// =====================================

addProjectButton.addEventListener("click", function () {

    projectFileInput.click();

});


projectFileInput.addEventListener("change", function () {

    const file = projectFileInput.files[0];

    if (!file) {
        return;
    }


    const allowedExtensions = [
        "doc",
        "docx",
        "ppt",
        "pptx",
        "pdf"
    ];

    const extension = file.name.split(".").pop().toLowerCase();


    if (!allowedExtensions.includes(extension)) {

        alert("لطفاً فایل Word، PowerPoint یا PDF انتخاب کن.");

        projectFileInput.value = "";

        return;

    }


    selectedProjectFile = file;


    // حالا عکس پروژه را انتخاب می‌کنیم.

    projectImageInput.click();

});


// =====================================
// انتخاب تصویر و ثبت پروژه
// =====================================

projectImageInput.addEventListener("change", async function () {

    const imageFile = projectImageInput.files[0];


    if (!selectedProjectFile) {
        return;
    }


    if (!imageFile) {

        alert("برای پروژه‌ات یک تصویر انتخاب کن.");

        projectFileInput.value = "";

        projectImageInput.value = "";

        selectedProjectFile = null;

        return;

    }


    if (!imageFile.type.startsWith("image/")) {

        alert("فایل انتخابی باید تصویر باشد.");

        return;

    }


    // پرسیدن نام پروژه

    const title = prompt(
        "نام پروژه‌ات را وارد کن:"
    );


    if (title === null || !title.trim()) {

        alert("افزودن پروژه لغو شد.");

        projectFileInput.value = "";

        projectImageInput.value = "";

        selectedProjectFile = null;

        return;

    }


    const project = {

        title: title.trim(),

        file: selectedProjectFile,

        image: imageFile,

        createdAt: new Date().toISOString()

    };


    try {

        await saveProject(project);

        await renderProjects();

        alert("پروژه با موفقیت اضافه شد! 🎉");

    } catch (error) {

        console.error(error);

        alert(
            "ذخیره پروژه انجام نشد. ممکن است فضای ذخیره‌سازی مرورگر کافی نباشد."
        );

    }


    // پاک کردن ورودی‌ها برای انتخاب بعدی

    projectFileInput.value = "";

    projectImageInput.value = "";

    selectedProjectFile = null;

});


// =====================================
// رنگ‌های تخته مجازی
// =====================================

const noteColors = [
    "#fff0a8",
    "#d9f7e8",
    "#dceaff",
    "#ffe0ec",
    "#eadfff",
    "#ffebd6"
];


// =====================================
// دریافت یادداشت‌ها
// =====================================

function getNotes() {

    try {

        return JSON.parse(
            localStorage.getItem("kamyarBoardNotes") || "[]"
        );

    } catch (error) {

        console.error(error);

        return [];

    }

}


// =====================================
// ذخیره یادداشت‌ها
// =====================================

function saveNotes(notes) {

    localStorage.setItem(
        "kamyarBoardNotes",
        JSON.stringify(notes)
    );

}


// =====================================
// نمایش یادداشت‌ها
// =====================================

function renderNotes() {

    const notes = getNotes();

    notesGrid.replaceChildren();


    notes.forEach(function (note) {

        const card = document.createElement("article");

        card.className = "note";

        card.style.backgroundColor = note.color;


        const text = document.createElement("p");

        text.textContent = note.text;


        const footer = document.createElement("div");

        footer.className = "note-footer";


        const date = document.createElement("small");

        date.textContent = note.date;


        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className = "note-delete";

        deleteButton.textContent = "حذف یادداشت";


        deleteButton.addEventListener("click", function () {

            const updatedNotes = getNotes().filter(function (item) {

                return item.id !== note.id;

            });

            saveNotes(updatedNotes);

            renderNotes();

        });


        footer.append(date, deleteButton);

        card.append(text, footer);

        notesGrid.appendChild(card);

    });

}


// =====================================
// افزودن یادداشت جدید
// =====================================

function addNote() {

    const text = noteInput.value.trim();


    if (!text) {

        alert("اول یادداشتت را بنویس!");

        return;

    }


    const notes = getNotes();


    const newNote = {

        id: Date.now() + Math.random(),

        text: text,

        color: noteColors[
            Math.floor(Math.random() * noteColors.length)
        ],

        date: new Date().toLocaleDateString("fa-IR")

    };


    notes.unshift(newNote);


    try {

        saveNotes(notes);

        renderNotes();

        noteInput.value = "";

    } catch (error) {

        console.error(error);

        alert("ذخیره یادداشت انجام نشد.");

    }

}


addNoteButton.addEventListener("click", addNote);


noteInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        addNote();

    }

});


// =====================================
// شروع برنامه
// =====================================

async function initializePage() {

    try {

        await renderProjects();

    } catch (error) {

        console.error(error);

        alert(
            "دریافت پروژه‌ها انجام نشد. صفحه را در یک مرورگر به‌روز باز کن."
        );

    }

    renderNotes();

}


initializePage();