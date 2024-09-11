// 从URL中获取table-id
const urlParams = new URLSearchParams(window.location.search);
const tableId = parseInt(urlParams.get('table-id'));
const recordId = parseInt(urlParams.get('record-id'));
const testClass = parseInt(urlParams.get('test-class'));
// const apiBaseUrl = 'http://10.10.8.225:8000';
const apiBaseUrl = 'https://sle-backend.onrender.com';
const userIdd = parseInt(urlParams.get('user-id')); 

// console.log(recordId)

Promise.all([
    fetch('tableName.json').then(response => response.json()),
    fetch('featureName.json').then(response => response.json())
])
.then(([tablesData, featuresData]) => {
    // console.log(tablesData)
    // console.log(featuresData)
    const table = tablesData.tables.find(t => t.id === tableId);
    // console.log(table)
    if (table) {
        document.getElementById('table-name').innerText = `${table.nameCN}`;
        // document.getElementById('table-description').innerText = table.description;

        const relevantFeatures = featuresData.features.filter(f => f.feature_table === tableId);
        // console.log(relevantFeatures)

        const form = document.getElementById('feature-form');

        relevantFeatures.forEach(feature => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');

            label.innerText = `${feature.feature_name_cn}`;
            formGroup.appendChild(label);

            // const input = document.createElement('input');
            // input.type = getInputType(feature.feature_class);
            // input.name = feature.feature_name_en;
            // input.placeholder = feature.feature_description;
            // console.log("Input element created with type:", input.type);
            
            let input;
            if (feature.feature_class === 'bool') {
                // 如果是bool类型，使用两个radio button
                input = createRadioGroup(feature.feature_name_en);
            } else {
                input = document.createElement('input');
                input.type = getInputType(feature.feature_class);
                input.name = feature.feature_name_en;
                input.placeholder = feature.feature_description;
                
                // 添加对 int 和 float 的验证
                if (feature.feature_class === 'int') {
                    input.addEventListener('input', function() {
                        this.value = this.value.replace(/[^0-9]/g, ''); // 只允许输入整数
                    });
                } else if (feature.feature_class === 'float') {
                    input.addEventListener('input', function() {
                        this.value = this.value.replace(/[^0-9.]/g, ''); // 只允许输入数字和小数点
                        if ((this.value.match(/\./g) || []).length > 1) {
                            this.value = this.value.slice(0, -1); // 限制只能有一个小数点
                        }
                    });
                }
            }

            formGroup.appendChild(input);

            if (feature.unit) {
                const unitSpan = document.createElement('span');
                unitSpan.innerText = ` (${feature.unit})`;
                label.appendChild(unitSpan);
            }
            // formGroup.appendChild(input);

            const description = document.createElement('div');
            description.className = 'description';
            description.innerText = feature.feature_description;
            // formGroup.appendChild(description);

            form.appendChild(formGroup);



        });

        // submit
        document.getElementById('submit-button').addEventListener('click', function(event) {
            event.preventDefault(); 
            // console.log(tableId,recordId)
            const formData = new FormData(document.getElementById('feature-form'));

            // for (let [key, value] of formData.entries()) {
            //     console.log(key, value);
            // }

            const dataToSubmit = {};

            formData.forEach((value, key) => {
                // 根据特征名称 (key) 获取其对应的 feature_id
                const feature = relevantFeatures.find(f => f.feature_name_en === key);
                if (feature) {
                    const featureId = `feature_${feature.feature_id}`;
                    // console.log(featIreId)
                    
                    // 根据 feature_class 处理数据类型
                    if (feature.feature_class === 'int') {
                        dataToSubmit[featureId] = parseInt(value);
                    } else if (feature.feature_class === 'float') {
                        dataToSubmit[featureId] = parseFloat(value);
                    } else if (feature.feature_class === 'bool') {
                        dataToSubmit[featureId] = value === 'true'; // 转换为布尔值
                    } else if (feature.feature_class === 'str') {
                        dataToSubmit[featureId] = value;
                    }
                }
            });

            // console.log(JSON.stringify(dataToSubmit))
            // 调用api
            fetch(`${apiBaseUrl}/add/${tableId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSubmit)
            })
            .then(response => response.json())
            .then(result => {
                if (result.id) {
                    // 第一个API调用成功，获取inserted_id
                    const insertedId = result.id;
                    // console.log(insertedId)
                    // 准备第二个API调用的数据
                    const updateData = {
                        last_checkout: new Date().toISOString().split('T')[0], // 当前时间
                    };
                    updateData[`record_table_${tableId}_id`] = insertedId;
                    // console.log(updateData)
                    return fetch(`${apiBaseUrl}/update_record/${recordId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateData)
                    }) ;
                } else {
                    throw new Error('Failed to insert data');
                }
                
            }).then(updateResponse => updateResponse.json())
            .then(updateResult => {
                // 确保update成功后才执行以下操作
                // console.log(updateResult,updateResult.success)
                if (updateResult) {
                    // 标记该表单已完成
                    const completedTables = JSON.parse(localStorage.getItem(`completedTables_${recordId}`) || '{}');
                    completedTables[tableId] = true;
                    localStorage.setItem(`completedTables_${recordId}`, JSON.stringify(completedTables));
        
                    // 最终执行跳转操作
                    window.location.href = `choose-test.html?record-id=${recordId}&test-class=${testClass}&user-id=${userIdd}`;
                } else {
                    throw new Error('Failed to update record');
                }
            }).catch(error => {
                console.error('Error:', error);
                alert('An error occurred while submitting the form');
            });

        // 标记该表单已完成
        // const completedTables = JSON.parse(localStorage.getItem('completedTables') || '{}');
        // completedTables[tableId] = true;
        // localStorage.setItem('completedTables', JSON.stringify(completedTables));

        // window.location.href = `choose-test.html?record-id=${recordId}&test-class=${testClass}`;
        });
    }
});

function getInputType(featureClass) {
    switch (featureClass) {
        case 'int':
            return 'number';
        case 'float':
            return 'text'; // 使用text字段便于手动输入小数并添加验证
        case 'str':
            return 'text';
        default:
            return 'text';
    }
}

function createRadioGroup(name) {
    console.log(name)
    const container = document.createElement('div');
    container.classList.add('radio-group');
    const yesLabel = document.createElement('label');
    yesLabel.classList.add('radio-label');
    const noLabel = document.createElement('label');
    noLabel.classList.add('radio-label');


    const yesInput = document.createElement('input');
    yesInput.type = 'radio';
    yesInput.name = name;
    yesInput.value = 'true';
    yesInput.classList.add('radio-input');

    const noInput = document.createElement('input');
    noInput.type = 'radio';
    noInput.name = name;
    noInput.value = 'false';
    noInput.classList.add('radio-input');

    if (name === 'gender') {

    yesLabel.appendChild(yesInput);
    yesLabel.appendChild(document.createTextNode('男'));
    noLabel.appendChild(noInput);
    noLabel.appendChild(document.createTextNode('女'));
    } else {
        yesLabel.appendChild(yesInput);
        yesLabel.appendChild(document.createTextNode('有'));
        noLabel.appendChild(noInput);
        noLabel.appendChild(document.createTextNode('无'));
    }

    container.appendChild(yesLabel);
    container.appendChild(noLabel);

    return container;
}
document.getElementById('sidebar-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});
// 添加新的DOMContentLoaded监听器，专门处理面包屑导航
document.addEventListener("DOMContentLoaded", function() {
    const breadcrumb = document.getElementById('breadcrumb');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user-id');
    const recordId = urlParams.get('record-id');
    const testClass = urlParams.get('test-class');
    const tableId = urlParams.get('table-id');

    let breadcrumbHTML = '';
    breadcrumbHTML += `<li class="breadcrumb-item"><a href="http://localhost:8000/main-page.html">首页</a></li>`;

    if (userId) {
        breadcrumbHTML += `<li class="breadcrumb-item"><a href="http://localhost:8000/index.html?user-id=${userId}">个人主页</a></li>`;
    }

    if (recordId && testClass) {
        breadcrumbHTML += `<li class="breadcrumb-item"><a href="http://localhost:8000/choose-test.html?record-id=${recordId}&test-class=${testClass}&user-id=${userId}">选择测试</a></li>`;
    }

    if (tableId) {
        breadcrumbHTML += `<li class="breadcrumb-item">填写表单 (${tableId})</li>`;
    }

    breadcrumb.innerHTML = breadcrumbHTML;
});