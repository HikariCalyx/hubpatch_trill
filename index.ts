import { Editor as BN5Editor } from "./editor/bn5";
import { Editor as BN6Editor } from "./editor/bn6";
import { Editor, EditorConstructor } from "./editor/index";

const EDITOR_CONSTRUCTORS: EditorConstructor[] = [BN5Editor, BN6Editor];

const saveFileInput = document.getElementById("save")! as HTMLInputElement;
const patchCardsTable = document.getElementById("patch-cards")!;
const totalRow = document.getElementById("total-row")!;
const totalMB = document.getElementById("total-mb")!;
const maxMB = document.getElementById("max-mb")!;
const downloadButton = document.getElementById(
    "download"
)! as HTMLButtonElement;
const addPatchCardSelect = document.getElementById(
    "add-patch-card"
)! as HTMLSelectElement;
const addPatchCardSelectCaption = addPatchCardSelect
    .querySelector("option:first-child")!
    .cloneNode(true);

function downloadBlob(blob: Blob, name: string) {
    const objectURL = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = name;
    a.href = objectURL;
    a.textContent = "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectURL);
}

function populatePatchCards() {
    addPatchCardSelect.innerHTML = "";
    addPatchCardSelect.appendChild(addPatchCardSelectCaption);

    const patchCardInfos = editor.getPatchCardInfos();
    for (let i = 1; i < patchCardInfos.length; ++i) {
        const { name, nameJa, mb } = patchCardInfos[i];
        const option = document.createElement("option");
        addPatchCardSelect.appendChild(option);
        option.textContent = `${name}・${nameJa} (${mb} MB)`;
        option.value = i.toString();
    }
}

addPatchCardSelect.addEventListener("change", () => {
    if (addPatchCardSelect.value == "") {
        return;
    }
    const id = parseInt(addPatchCardSelect.value);
    editor.setPatchCardCount(editor.getPatchCardCount() + 1);
    editor.setPatchCard(editor.getPatchCardCount() - 1, id, true);
    addPatchCardSelect.value = "";
    update();
});

function deletePatchCard(editor: Editor, i: number) {
    const n = editor.getPatchCardCount();
    for (; i < n - 1; ++i) {
        const { id, enabled } = editor.getPatchCard(i + 1)!;
        editor.setPatchCard(i, id, enabled);
    }
    editor.setPatchCardCount(editor.getPatchCardCount() - 1);
}

const MAX_MB = 80;

function update() {
    const patchCardInfos = editor.getPatchCardInfos();
    maxMB.textContent = MAX_MB.toString();

    const tbody = patchCardsTable.querySelector("tbody")!;
    tbody.innerHTML = "";

    let total = 0;
    for (let i = 0, n = editor.getPatchCardCount(); i < n; ++i) {
        const { id, enabled } = editor.getPatchCard(i)!;
        const patchCard = patchCardInfos[id];
        if (enabled) {
            total += patchCard.mb;
        }

        const tr = document.createElement("tr");
        tbody.appendChild(tr);

        if (!enabled) {
            tr.className = "text-body-tertiary";
        }

        const deleteTd = document.createElement("td");
        tr.appendChild(deleteTd);

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.innerHTML = `<i class="bi bi-x"></i>`;
        deleteButton.onclick = ((i: number) => {
            deletePatchCard(editor, i);
            update();
        }).bind(null, i);
        deleteTd.appendChild(deleteButton);

        const nameTd = document.createElement("td");
        tr.appendChild(nameTd);
        nameTd.textContent = `${patchCard.name}・${patchCard.nameJa}`;

        const mbTd = document.createElement("td");
        tr.appendChild(mbTd);
        mbTd.textContent = patchCard.mb.toString();

        if (total > MAX_MB) {
            tr.className = "text-danger";
        }
    }
    if (total > MAX_MB) {
        totalRow.classList.add("text-danger");
    } else {
        totalRow.classList.remove("text-danger");
    }
    totalMB.textContent = total.toString();

    for (const option of addPatchCardSelect.querySelectorAll("option")) {
        if (option.value == "") {
            continue;
        }
        const { mb } = patchCardInfos[parseInt(option.value, 10)];
        option.className = total + mb > MAX_MB ? "text-danger" : "";
    }
}

let editor: Editor;

downloadButton.addEventListener("click", () => {
    if (editor == null) {
        return;
    }
    const blob = new Blob([new Uint8Array(editor.export())]);
    downloadBlob(blob, `${(editor.constructor as EditorConstructor).NAME}.sav`);
});

saveFileInput.addEventListener("change", () => {
    if (saveFileInput.files == null || saveFileInput.files.length == 0) {
        return;
    }

    const file = saveFileInput.files[0];

    (async () => {
        const buf = await file.arrayBuffer();
        const errors: [EditorConstructor, any][] = [];

        for (const Editor of EDITOR_CONSTRUCTORS) {
            try {
                editor = new Editor(buf);
            } catch (e) {
                errors.push([Editor, e]);
            }
        }

        if (editor == null) {
            alert(
                `无法加载存档\n\n${errors
                    .map(([Editor, e]) => ` • ${Editor.NAME}: ${e}`)
                    .join("\n")}`
            );
            saveFileInput.value = "";
            return;
        }

        populatePatchCards();
        update();
        downloadButton.disabled = false;
        addPatchCardSelect.disabled = false;
    })();
});

saveFileInput.value = "";
