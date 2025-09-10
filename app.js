// --- Constants ---
const TYPE_LABELS = {
    string: 'String',
    number: 'Number',
    boolean: 'Boolean',
    array: 'Array',
    object: 'Object',
    null: 'Null'
};

const ERROR_MESSAGES = {
    required: 'Field name is required!',
    invalid: 'Invalid field name! Only letters, numbers, _ and $ are allowed.',
    duplicate: 'This field name already exists!',
    invalidNumber: 'Invalid number value!'
};

// --- State ---
let jsonData = {};
let currentPath = '';
let editingField = null;
let modalInstance = null;
let jsonUploadModalInstance = null;
let deletePendingPath = null;
let deletePendingRefresh = true;
let deleteModalInstance = null;

// --- Theme ---
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggleBtn');
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        btn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

// --- Sample Data ---
function loadSampleData() {
    jsonData = {
        "id": 1,
        "name": "Ali Demir",
        "email": "ali.demir@example.com",
        "phone": "+90 532 123 45 67",
        "addresses": [
            {
                "type": "home",
                "street": "Atatürk Cad. No:45",
                "city": "İstanbul",
                "country": "Türkiye",
                "postalCode": "34000"
            },
            {
                "type": "work",
                "street": "Teknopark Sok. No:12",
                "city": "İstanbul",
                "country": "Türkiye",
                "postalCode": "34906"
            }
        ],
        "roles": ["developer", "admin"]
    };
    renderForm();
    updatePreview();
}

// --- Render Functions ---
function renderForm() {
    const container = document.getElementById('json-form');
    container.innerHTML = '';
    renderObject(jsonData, '', container);
}

function renderObject(obj, path, container) {
    for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'field-container';
        fieldContainer.appendChild(createFieldHeader(key, value, currentPath));
        if (Array.isArray(value)) {
            renderArray(value, currentPath, fieldContainer);
        } else if (typeof value === 'object' && value !== null) {
            const nestedContainer = document.createElement('div');
            nestedContainer.className = 'nested-container';
            renderObject(value, currentPath, nestedContainer);
            const addBtn = createAddFieldButton(currentPath);
            nestedContainer.appendChild(addBtn);
            fieldContainer.appendChild(nestedContainer);
        } else {
            fieldContainer.appendChild(createValueInput(value, currentPath));
        }
        container.appendChild(fieldContainer);
    }
}

function renderArray(arr, path, container) {
    const arrayContainer = document.createElement('div');
    arrayContainer.className = 'nested-container';
    arr.forEach((item, index) => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'array-item';
        itemContainer.appendChild(createArrayItemHeader(path, index, item));
        const currentPath = `${path}[${index}]`;
        if (Array.isArray(item)) {
            renderArray(item, currentPath, itemContainer);
        } else if (typeof item === 'object' && item !== null) {
            const nestedContainer = document.createElement('div');
            renderObject(item, currentPath, nestedContainer);
            const addBtn = createAddFieldButton(currentPath);
            nestedContainer.appendChild(addBtn);
            itemContainer.appendChild(nestedContainer);
        } else {
            itemContainer.appendChild(createArrayValueInput(path, index, item));
        }
        arrayContainer.appendChild(itemContainer);
    });
    if (arr.length === 0) {
        const emptyInfo = document.createElement('div');
        emptyInfo.className = 'text-muted mb-2';
        emptyInfo.textContent = 'Dizi boş. Eleman ekleyin:';
        arrayContainer.appendChild(emptyInfo);
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-success btn-sm';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Dizi Elemanı Ekle';
        addBtn.onclick = () => addArrayItemWithType(path);
        arrayContainer.appendChild(addBtn);
    } else {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-success btn-sm';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Dizi Elemanı Ekle';
        addBtn.onclick = () => addArrayItem(path);
        arrayContainer.appendChild(addBtn);
    }
    container.appendChild(arrayContainer);
}

// --- UI Helpers ---
function createFieldHeader(key, value, currentPath) {
    const header = document.createElement('div');
    header.className = 'field-header';
    header.innerHTML = `
        <div>
            <span class="badge bg-info type-badge">${getTypeLabel(value)}</span>
            <strong>${key}</strong>
        </div>
        <div>
            <button class="btn btn-outline-primary btn-sm-custom me-1" onclick="editField('${currentPath}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm-custom" onclick="deleteField('${currentPath}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return header;
}

function createAddFieldButton(currentPath) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-success btn-sm mt-2';
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Alt Alan Ekle';
    addBtn.onclick = () => showFieldModal(currentPath);
    return addBtn;
}

function createValueInput(value, currentPath) {
    const valueContainer = document.createElement('div');
    valueContainer.innerHTML = `
        <input type="${getInputType(value)}" class="form-control" 
               value="${value}" onchange="updateValue('${currentPath}', this.value, '${typeof value}')">
    `;
    return valueContainer;
}

function createArrayItemHeader(path, index, item) {
    const itemHeader = document.createElement('div');
    itemHeader.className = 'field-header';
    itemHeader.innerHTML = `
        <div>
            <span class="badge bg-secondary type-badge">[${index}]</span>
            <span class="badge bg-info type-badge">${getTypeLabel(item)}</span>
        </div>
        <div>
            <button class="btn btn-outline-danger btn-sm-custom" onclick="deleteArrayItem('${path}', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return itemHeader;
}

function createArrayValueInput(path, index, item) {
    const valueContainer = document.createElement('div');
    valueContainer.innerHTML = `
        <input type="${getInputType(item)}" class="form-control" 
               value="${item}" onchange="updateArrayValue('${path}', ${index}, this.value, '${typeof item}')">
    `;
    return valueContainer;
}

// --- Utility Functions ---
function getTypeLabel(value) {
    if (Array.isArray(value)) return 'Array';
    if (value === null) return 'Null';
    if (typeof value === 'object') return 'Object';
    return typeof value;
}

function getInputType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'checkbox';
    return 'text';
}

function parsePath(path) {
    const regex = /([^[.\]]+)|\[(\d+)\]/g;
    const result = [];
    let match;
    while ((match = regex.exec(path))) {
        if (match[1]) result.push(match[1]);
        if (match[2]) result.push(Number(match[2]));
    }
    return result;
}

function convertValue(value, type) {
    switch (type) {
        case 'number':
            return isNaN(value) ? 0 : Number(value);
        case 'boolean':
            return value === 'true' || value === true;
        case 'null':
            return null;
        default:
            return value;
    }
}

function getValueByPath(path) {
    const keys = parsePath(path);
    let current = jsonData;
    for (const key of keys) {
        current = current[key];
    }
    return current;
}

function setValueByPath(path, value) {
    const keys = parsePath(path);
    let current = jsonData;
    for (let i = 0; i < keys.length - 1; i++) {
        if (typeof keys[i + 1] === 'number') {
            if (!Array.isArray(current[keys[i]])) current[keys[i]] = [];
        } else {
            if (!current[keys[i]]) current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}

// --- Modal and Field Operations ---
function showFieldModal(path = '') {
    currentPath = path;
    editingField = null;
    document.getElementById('fieldForm').reset();
    document.getElementById('fieldName').value = '';
    document.getElementById('fieldName').disabled = false;
    document.getElementById('fieldType').value = 'string';
    document.getElementById('fieldType').disabled = false;
    handleTypeChange();
    if (!modalInstance) {
        modalInstance = new bootstrap.Modal(document.getElementById('fieldModal'));
    }
    modalInstance.show();
}

function addRootField() {
    showFieldModal('');
}

function editField(path) {
    const value = getValueByPath(path);
    const keys = parsePath(path);
    const fieldName = keys[keys.length - 1];
    editingField = path;
    if (keys.length > 1) {
        let parentPath = '';
        for (let i = 0; i < keys.length - 1; i++) {
            if (typeof keys[i] === 'number') {
                parentPath += `[${keys[i]}]`;
            } else {
                if (parentPath) parentPath += '.';
                parentPath += keys[i];
            }
        }
        currentPath = parentPath;
    } else {
        currentPath = '';
    }
    document.getElementById('fieldName').value = fieldName;
    document.getElementById('fieldName').disabled = true;
    document.getElementById('fieldType').value = getTypeLabel(value).toLowerCase();
    document.getElementById('fieldType').disabled = true;
    if (typeof value === 'boolean') {
        document.getElementById('booleanValue').value = value.toString();
    } else if (!Array.isArray(value) && typeof value !== 'object') {
        document.getElementById('fieldValue').value = value;
    }
    handleTypeChange();
    if (!modalInstance) {
        modalInstance = new bootstrap.Modal(document.getElementById('fieldModal'));
    }
    modalInstance.show();
}

function handleTypeChange() {
    const type = document.getElementById('fieldType').value;
    const valueField = document.getElementById('valueField');
    const booleanField = document.getElementById('booleanField');
    const arrayTypeField = document.getElementById('arrayTypeField');
    valueField.style.display = 'block';
    booleanField.style.display = 'none';
    arrayTypeField.style.display = 'none';
    if (type === 'boolean') {
        valueField.style.display = 'none';
        booleanField.style.display = 'block';
    } else if (type === 'array') {
        valueField.style.display = 'none';
        arrayTypeField.style.display = 'block';
    } else if (type === 'object' || type === 'null') {
        valueField.style.display = 'none';
    }
}

function saveField() {
    const name = document.getElementById('fieldName').value.trim();
    const type = document.getElementById('fieldType').value;
    document.getElementById('fieldNameError').textContent = '';
    if (!name) {
        document.getElementById('fieldNameError').textContent = 'Alan adı gereklidir!';
        return false;
    }
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
        document.getElementById('fieldNameError').textContent = 'Geçersiz alan adı! Sadece harf, rakam, _ ve $ kullanılabilir.';
        return false;
    }
    let parentObj = jsonData;
    if (currentPath) {
        parentObj = getValueByPath(currentPath);
    }
    if (!editingField && parentObj && typeof parentObj === 'object' && !Array.isArray(parentObj) && Object.prototype.hasOwnProperty.call(parentObj, name)) {
        document.getElementById('fieldNameError').textContent = 'Bu alan adı zaten var!';
        return false;
    }
    let value;
    switch (type) {
        case 'string':
            value = document.getElementById('fieldValue').value || '';
            break;
        case 'number':
            const numValue = document.getElementById('fieldValue').value;
            value = numValue === '' ? 0 : Number(numValue);
            if (isNaN(value)) {
                showAlertModal('Geçersiz sayı değeri!');
                return false;
            }
            break;
        case 'boolean':
            value = document.getElementById('booleanValue').value === 'true';
            break;
        case 'array':
            const elementType = document.getElementById('arrayElementType').value;
            value = [];
            if (elementType === 'string') value.push('');
            else if (elementType === 'number') value.push(0);
            else if (elementType === 'boolean') value.push(false);
            else if (elementType === 'object') value.push({});
            else if (elementType === 'array') value.push([]);
            else if (elementType === 'null') value.push(null);
            break;
        case 'object':
            value = {};
            break;
        case 'null':
            value = null;
            break;
    }
    if (editingField) {
        const oldKeys = parsePath(editingField);
        const oldFieldName = oldKeys[oldKeys.length - 1];
        if (oldFieldName === name) {
            setValueByPath(editingField, value);
        } else {
            doDeleteField(editingField, false);
            setValueByPath(currentPath ? `${currentPath}.${name}` : name, value);
        }
    } else {
        const targetPath = currentPath ? `${currentPath}.${name}` : name;
        setValueByPath(targetPath, value);
    }
    modalInstance.hide();
    renderForm();
    updatePreview();
}

function showAlertModal(message) {
    document.getElementById('alertModalMessage').textContent = message;
    if (!window.alertModalInstance) {
        window.alertModalInstance = new bootstrap.Modal(document.getElementById('alertModal'));
    }
    window.alertModalInstance.show();
}

// --- Array Operations ---
function addArrayItemWithType(path) {
    const type = prompt('Eklenecek eleman tipi (string, number, boolean, object, array, null):', 'string');
    let defaultValue = '';
    if (type === 'number') defaultValue = 0;
    else if (type === 'boolean') defaultValue = false;
    else if (type === 'object') defaultValue = {};
    else if (type === 'array') defaultValue = [];
    else if (type === 'null') defaultValue = null;
    else defaultValue = '';
    const arr = getValueByPath(path);
    arr.push(defaultValue);
    renderForm();
    updatePreview();
}

function addArrayItem(path) {
    const arr = getValueByPath(path);
    let defaultValue = '';
    if (arr.length > 0) {
        const firstItem = arr[0];
        if (typeof firstItem === 'number') defaultValue = 0;
        else if (typeof firstItem === 'boolean') defaultValue = false;
        else if (Array.isArray(firstItem)) defaultValue = [];
        else if (typeof firstItem === 'object') defaultValue = {};
        else defaultValue = '';
    }
    arr.push(defaultValue);
    renderForm();
    updatePreview();
}

function deleteArrayItem(path, index) {
    const arr = getValueByPath(path);
    arr.splice(index, 1);
    renderForm();
    updatePreview();
}

// --- Value Update ---
function updateValue(path, value, type) {
    const keys = path.split('.');
    let current = jsonData;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    const convertedValue = convertValue(value, type);
    current[keys[keys.length - 1]] = convertedValue;
    updatePreview();
}

function updateArrayValue(path, index, value, type) {
    const obj = getValueByPath(path);
    obj[index] = convertValue(value, type);
    updatePreview();
}

// --- Delete Field ---
function deleteField(path, refresh = true) {
    showDeleteConfirmModal(path, refresh);
}

function showDeleteConfirmModal(path, refresh) {
    deletePendingPath = path;
    deletePendingRefresh = refresh;
    if (!deleteModalInstance) {
        deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    }
    deleteModalInstance.show();
}

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('deleteConfirmBtn');
    if (btn) {
        btn.addEventListener('click', function () {
            if (deletePendingPath !== null) {
                doDeleteField(deletePendingPath, deletePendingRefresh);
                deletePendingPath = null;
                deleteModalInstance.hide();
            }
        });
    }
});

function doDeleteField(path, refresh = true) {
    const keys = parsePath(path);
    let current = jsonData;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    if (typeof keys[keys.length - 1] === 'number' && Array.isArray(current)) {
        current.splice(keys[keys.length - 1], 1);
    } else {
        delete current[keys[keys.length - 1]];
    }
    if (refresh) {
        renderForm();
        updatePreview();
    }
}

// --- Preview, Clipboard, Validation ---
function updatePreview() {
    const output = document.getElementById('json-output');
    output.textContent = JSON.stringify(jsonData, null, 2);
}

function copyToClipboard() {
    const jsonText = JSON.stringify(jsonData, null, 2);
    navigator.clipboard.writeText(jsonText).then(() => {
        alert('JSON panoya kopyalandı!');
    });
}

function validateJson() {
    const result = document.getElementById('validation-result');
    try {
        JSON.stringify(jsonData);
        result.innerHTML = '<div class="alert alert-success alert-sm">✅ JSON geçerli!</div>';
    } catch (error) {
        result.innerHTML = `<div class="alert alert-danger alert-sm">❌ Hata: ${error.message}</div>`;
    }
}

function clearJsonData() {
    jsonData = {};
    renderForm();
    updatePreview();
}

// --- JSON Upload Modal ---
function openJsonUploadModal() {
    document.getElementById('jsonUploadInput').value = '';
    document.getElementById('jsonUploadValidation').innerHTML = '';
    document.getElementById('jsonUploadSubmitBtn').disabled = true;
    if (!jsonUploadModalInstance) {
        jsonUploadModalInstance = new bootstrap.Modal(document.getElementById('jsonUploadModal'));
    }
    const input = document.getElementById('jsonUploadInput');
    input.removeEventListener('input', validateJsonUploadInput);
    input.addEventListener('input', validateJsonUploadInput);
    jsonUploadModalInstance.show();
}

function validateJsonUploadInput() {
    const input = document.getElementById('jsonUploadInput').value;
    const validationDiv = document.getElementById('jsonUploadValidation');
    const submitBtn = document.getElementById('jsonUploadSubmitBtn');
    if (!input.trim()) {
        validationDiv.innerHTML = '';
        submitBtn.disabled = true;
        return;
    }
    try {
        JSON.parse(input);
        validationDiv.innerHTML = '<span class="text-success">Veri formatı doğrudur.</span>';
        submitBtn.disabled = false;
    } catch (e) {
        validationDiv.innerHTML = '<span class="text-danger">Veri formatı <b>yanlıştır:</b> ' + e.message + '</span>';
        submitBtn.disabled = true;
    }
}

function submitJsonUpload() {
    const input = document.getElementById('jsonUploadInput').value;
    try {
        const parsed = JSON.parse(input);
        jsonData = parsed;
        jsonUploadModalInstance.hide();
        renderForm();
        updatePreview();
    } catch (e) {
        document.getElementById('jsonUploadValidation').innerHTML = '<span class="text-danger">Veri formatı <b>yanlıştır:</b> ' + e.message + '</span>';
    }
}

// --- Onload ---
window.onload = function () {
    renderForm();
    updatePreview();
    const input = document.getElementById('jsonUploadInput');
    if (input) {
        input.addEventListener('input', validateJsonUploadInput);
    }
};
