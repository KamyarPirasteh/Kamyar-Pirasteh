const $ = (selector) => document.querySelector(selector);

const stage = $("#stage");
const slidesList = $("#slidesList");
const projectsGrid = $("#projectsGrid");

const STORAGE_KEY = "kamyar_creative_projects_v1";

let project = newProject();
let currentSlide = 0;
let selectedId = null;
let projects = readProjects();

let activePointer = null;
let editingId = null;

function uid() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function newSlide() {
    return { id: uid(), elements: [] };
}

function newProject() {
    return {
        id: uid(),
        name: "پروژه بدون نام",
        slides: [newSlide()],
        updatedAt: new Date().toISOString()
    };
}

function readProjects() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function persistProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return true;
    } catch {
        alert("فضای ذخیره‌سازی مرورگر کافی نیست. عکس‌های بزرگ را کوچک‌تر کن.");
        return false;
    }
}

function currentElements() {
    return project.slides[currentSlide].elements;
}

function selectedElement() {
    return currentElements().find(el => el.id === selectedId);
}

function updateEmptyState() {
    $("#stageEmpty").style.display =
        currentElements().length ? "none" : "flex";
}

function renderStage() {
    stage.querySelectorAll(".stage-element").forEach(el => el.remove());

    for (const el of currentElements()) {
        const node = document.createElement("div");

        node.className = "stage-element";
        node.dataset.id = el.id;
        node.style.left = el.x + "%";
        node.style.top = el.y + "%";
        node.style.width = el.w + "%";
        node.style.height = el.h + "%";

        if (el.id === selectedId) node.classList.add("selected");

        if (el.type === "text") {
            node.classList.add("text-element");
            node.textContent = el.text || "متن خود را بنویسید";
            node.style.color = el.color;
            node.style.fontSize = `clamp(5px, ${el.size / 5.62}cqw, 100px)`;
            node.style.fontWeight = el.bold ? "700" : "400";
            node.setAttribute("aria-label", "متن؛ برای ویرایش دوبار کلیک کنید");
            node.title = "برای ویرایش متن دوبار کلیک کنید";
        } else if (el.type === "image") {
            const img = document.createElement("img");
            img.src = el.src;
            img.alt = "تصویر پروژه";
            node.appendChild(img);
        } else {
            node.classList.add("shape-" + el.type);
            node.style.backgroundColor = el.color;

            if (el.type === "line") {
                node.style.height = "3px";
            }
        }

        const handle = document.createElement("span");
        handle.className = "resize-handle";
        handle.setAttribute("aria-label", "تغییر اندازه");
        node.appendChild(handle);

        node.addEventListener("pointerdown", event => {
            if (event.target === handle) {
                startPointerAction(event, el, "resize");
                return;
            }

            if (editingId === el.id) return;

            selectElement(el.id);

            if (event.button !== 0) return;
            startPointerAction(event, el, "drag");
        });

        node.addEventListener("dblclick", event => {
            if (el.type !== "text") return;
            event.preventDefault();
            event.stopPropagation();
            editText(el, node);
        });

        stage.appendChild(node);
    }

    updateEmptyState();
    updateSlideLabels();
}

function renderThumbnails() {
    slidesList.innerHTML = "";

    project.slides.forEach((slide, index) => {
        const card = document.createElement("div");
        card.className = "slide-thumb" + (index === currentSlide ? " active" : "");

        const preview = document.createElement("div");
        preview.className = "thumb-preview";

        sli

de.elements.forEach(el => {
            const mini = document.createElement("div");
            mini.className = "thumb-element";
            mini.style.left = el.x + "%";
            mini.style.top = el.y + "%";
            mini.style.width = el.w + "%";
            mini.style.height = el.h + "%";

            if (el.type === "text") {
                mini.textContent = el.text || "";
                mini.style.color = el.color;
                mini.style.fontSize = "5px";
            } else if (el.type === "image") {
                const img = document.createElement("img");
                img.src = el.src;
                img.alt = "";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                mini.appendChild(img);
            } else {
                mini.style.backgroundColor = el.color;

                if (el.type === "circle") mini.style.borderRadius = "50%";
                if (el.type === "triangle") {
                    mini.style.clipPath = "polygon(50% 0,100% 100%,0 100%)";
                }
                if (el.type === "line") mini.style.height = "2px";
            }

            preview.appendChild(mini);
        });

        const name = document.createElement("div");
        name.className = "thumb-name";

        const label = document.createElement("span");
        label.textContent = "اسلاید " + (index + 1);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "حذف اسلاید";
        remove.addEventListener("click", event => {
            event.stopPropagation();
            deleteSlide(index);
        });

        name.append(label, remove);
        card.append(preview, name);

        card.addEventListener("click", () => {
            currentSlide = index;
            selectedId = null;
            editingId = null;
            renderAll();
        });

        slidesList.appendChild(card);
    });
}

function updateSlideLabels() {
    $("#currentSlideLabel").textContent = "اسلاید " + (currentSlide + 1);
    $("#slideCounter").textContent =
        `${currentSlide + 1} از ${project.slides.length}`;

    $("#prevSlideBtn").disabled = currentSlide === 0;
    $("#nextSlideBtn").disabled = currentSlide === project.slides.length - 1;
}

function renderAll() {
    renderStage();
    renderThumbnails();
}

function selectElement(id) {
    selectedId = id;
    const el = selectedElement();

    if (el) {
        $("#colorPicker").value = el.color || "#1779db";
        $("#sizeInput").value = el.size || 28;
    }

    renderStage();
}

function addElement(type, extra = {}) {
    const defaults = {
        id: uid(),
        type,
        x: 30,
        y: 25,
        w: type === "text" ? 40 : 20,
        h: type === "text" ? 15 : 20,
        color: $("#colorPicker").value,
        size: Math.max(10, Number($("#sizeInput").value) || 28)
    };

    if (type === "text") defaults.text = "متن خود را بنویسید";
    if (type === "line") defaults.h = 1;

    const el = { ...defaults, ...extra };
    currentElements().push(el);

    selectedId = el.id;
    editingId = null;

    renderAll();
    return el;
}

document.querySelectorAll("[data-tool]").forEach(button => {
    button.addEventListener("click", () => {
        const tool = button.dataset.tool;
        const el = addElement(tool === "text" ? "text" : tool);

        if (tool === "text") {
            const node = stage.querySelector(`[data-id="${el.id}"]`);
            if (node) editText(el, node);
        }
    });
});

function editText(el, node) {
    editingId = el.id;
    node.contentEditable = "true";
    node.focus();

    const range = document.createRange();
    range.selectNodeContents(node);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const finish = () => {
        el.text = node.innerText;
        node.contentEditable = "false";
        editingId = null;
        renderAll();
    };

    nod

e.addEventListener("blur", finish, { once: true });

    node.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            event.preventDefault();
            node.blur();
        }
    }, { once: true });
}

function startPointerAction(event, el, mode) {
    if (event.button !== 0) return;
    if (editingId === el.id) return;

    event.preventDefault();
    event.stopPropagation();

    selectElement(el.id);

    const rect = stage.getBoundingClientRect();

    activePointer = {
        id: event.pointerId,
        mode,
        el,
        startX: event.clientX,
        startY: event.clientY,
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        rect
    };

    const node = stage.querySelector(`[data-id="${el.id}"]`);
    node?.setPointerCapture?.(event.pointerId);
}

stage.addEventListener("pointermove", event => {
    if (!activePointer || event.pointerId !== activePointer.id) return;

    const a = activePointer;
    const dx = (event.clientX - a.startX) / a.rect.width * 100;
    const dy = (event.clientY - a.startY) / a.rect.height * 100;

    if (a.mode === "drag") {
        a.el.x = Math.max(0, Math.min(100 - a.el.w, a.x + dx));
        a.el.y = Math.max(0, Math.min(100 - a.el.h, a.y + dy));
    } else {
        a.el.w = Math.max(3, Math.min(100 - a.x, a.w + dx));
        a.el.h = Math.max(2, Math.min(100 - a.y, a.h + dy));
    }

    const node = stage.querySelector(`[data-id="${a.el.id}"]`);

    if (node) {
        node.style.left = a.el.x + "%";
        node.style.top = a.el.y + "%";
        node.style.width = a.el.w + "%";
        node.style.height = a.el.h + "%";
    }
});

function finishPointerAction() {
    if (!activePointer) return;

    activePointer = null;
    renderThumbnails();
}

stage.addEventListener("pointerup", finishPointerAction);
stage.addEventListener("pointercancel", finishPointerAction);

stage.addEventListener("click", event => {
    if (event.target === stage || event.target === $("#stageEmpty")) {
        selectedId = null;
        renderStage();
    }
});

$("#colorPicker").addEventListener("input", event => {
    const el = selectedElement();
    if (!el) return;

    el.color = event.target.value;
    renderStage();
    renderThumbnails();
});

$("#sizeInput").addEventListener("change", event => {
    const el = selectedElement();
    if (!el || el.type !== "text") return;

    el.size = Math.max(10, Math.min(100, Number(event.target.value) || 28));
    renderStage();
});

$("#deleteBtn").addEventListener("click", () => {
    if (!selectedId) {
        alert("اول یک عنصر را انتخاب کن.");
        return;
    }

    project.slides[currentSlide].elements =
        currentElements().filter(el => el.id !== selectedId);

    selectedId = null;
    editingId = null;
    renderAll();
});

$("#addSlideBtn").addEventListener("click", () => {
    project.slides.push(newSlide());
    currentSlide = project.slides.length - 1;
    selectedId = null;
    renderAll();
});

function deleteSlide(index) {
    if (project.slides.length === 1) {
        alert("پروژه باید حداقل یک اسلاید داشته باشد.");
        return;
    }

    if (!confirm("این اسلاید حذف شود؟")) return;

    project.slides.splice(index, 1);

    if (currentSlide >= project.slides.length) {
        currentSlide = project.slides.length - 1;
    } else if (index < currentSlide) {
        currentSlide--;
    }

    selectedId = null;
    renderAll();
}

$("#prevSlideBtn").addEventListener("click", () => {
    if (currentSlide > 0) {
        currentSlide--;
        selectedId = null;
        renderAll();
    }
});

$("#nextSlideBtn").addEventListener("click", () => {
    if (currentSlide < project.slides.length - 1) {
        currentSlide++;
        selectedId = null;
        renderAll();
    }
});

$("#imageInput").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("لطفاً یک فایل تصویری انتخاب کن.");
        event.target.value = "";
        return;
    }

    const reader = new F

ileReader();

    reader.onload = () => {
        addElement("image", {
            src: reader.result,
            w: 30,
            h: 30
        });
    };

    reader.onerror = () => alert("خواندن تصویر ناموفق بود.");
    reader.readAsDataURL(file);
    event.target.value = "";
});

function saveProject() {
    const suggested = project.name === "پروژه بدون نام" ? "" : project.name;
    const name = prompt("اسم پروژه‌ات را وارد کن:", suggested);

    if (name === null) return;

    if (!name.trim()) {
        alert("اسم پروژه نمی‌تواند خالی باشد.");
        return;
    }

    project.name = name.trim();
    project.updatedAt = new Date().toISOString();

    const existingIndex = projects.findIndex(p => p.id === project.id);

    if (existingIndex >= 0) {
        projects[existingIndex] = JSON.parse(JSON.stringify(project));
    } else {
        projects.unshift(JSON.parse(JSON.stringify(project)));
    }

    if (persistProjects()) {
        renderProjects();
        alert("پروژه ذخیره شد! 💙");
    }
}

$("#saveBtn").addEventListener("click", saveProject);

$("#newProjectBtn").addEventListener("click", () => {
    if (!confirm("یک پروژه جدید بسازیم؟ پروژه فعلی فقط در صورت ذخیره در فهرست می‌ماند.")) {
        return;
    }

    project = newProject();
    currentSlide = 0;
    selectedId = null;
    editingId = null;
    renderAll();
});

function loadProject(id) {
    const found = projects.find(p => p.id === id);
    if (!found) return;

    project = JSON.parse(JSON.stringify(found));
    currentSlide = 0;
    selectedId = null;
    editingId = null;
    renderAll();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProjects() {
    projectsGrid.innerHTML = "";

    if (!projects.length) {
        const empty = document.createElement("div");
        empty.className = "empty-projects";
        empty.textContent = "هنوز پروژه‌ای ذخیره نکرده‌ای. اولین پروژه‌ات را بساز! ✨";
        projectsGrid.appendChild(empty);
        return;
    }

    projects.forEach(saved => {
        const card = document.createElement("article");
        card.className = "project-card";

        const preview = document.createElement("div");
        preview.className = "project-preview";
        preview.textContent = "🎨";

        const info = document.createElement("div");
        info.className = "project-info";

        const title = document.createElement("h3");
        title.textContent = saved.name;

        const date = document.createElement("p");
        const parsedDate = new Date(saved.updatedAt);
        date.textContent =
            `${saved.slides.length} اسلاید • ${Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toLocaleDateString("fa-IR")}`;

        const actions = document.createElement("div");
        actions.className = "project-actions";

        const open = document.createElement("button");
        open.className = "open-project";
        open.textContent = "باز کردن";
        open.addEventListener("click", () => loadProject(saved.id));

        const remove = document.createElement("button");
        remove.textContent = "حذف";
        remove.addEventListener("click", () => {
            if (!confirm(`پروژه «${saved.name}» حذف شود؟`)) return;

            projects = projects.filter(p => p.id !== saved.id);

            if (persistProjects()) renderProjects();
        });

        actions.append(open, remove);
        info.append(title, date, actions);
        card.append(preview, info);
        projectsGrid.appendChild(card);
    });
}

renderAll();
renderProjects();