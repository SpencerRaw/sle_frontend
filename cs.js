document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('record-id');
    const testClass = params.get('test-class');
    const userIdd = params.get('user-id');
    // const completedTables = JSON.parse(localStorage.getItem('completedTables') || '{}');
    // 从 localStorage 中获取对应 record-id 的 completedTables
    let completedTables = JSON.parse(localStorage.getItem(`completedTables_${recordId}`)) || [];
    let diagnosisClass;
    // const apiBaseUrl = 'http://10.10.8.225:8000';
    const apiBaseUrl = 'https://sle-backend.onrender.com';

    switch (testClass) {
        case '1':
            diagnosisClass = 'basic';
            break;
        case '2':
            diagnosisClass = 'deep';
            break;
        case '3':
            diagnosisClass = 'image';
            break;
    }

    // console.log(recordId,testClass,completedTables)
    fetch('tableName.json')
        .then(response => response.json())
        .then(data => {
            const tables = data.tables.filter(table => {
                if (testClass == 1) return table.diagnosisClass === 'basic';
                if (testClass == 2) return table.diagnosisClass === 'deep';
                if (testClass == 3) return table.diagnosisClass === 'image';
            })
            // console.log(tables)
            ;
            const container = document.getElementById('cards-container');
            tables.forEach(table => {
                const card = document.createElement('div');
                card.className = 'card';
                if (completedTables[table.id]) {
                    card.classList.add('completed');
                }
                // card.innerHTML = `
                //     <div class="card-title">${table.nameCN} (${table.nameEN})</div>
                //     <div class="card-description">${table.description}</div>
                // `;
                card.innerHTML = `
                    <div class="card-title">${table.nameCN}</div>
                    <div class="card-description">${table.description}</div>
                `;
                card.addEventListener('click', function() {
                    // window.location.href = `form-fill.html?table-id=${table.id}&record-id=${recordId}`;
                    window.location.href = `form-fill.html?table-id=${table.id}&record-id=${recordId}&test-class=${testClass}&user-id=${userIdd}`;
                });
                container.appendChild(card);
            });
        });

        // function returnToHome() {
        //     // 从当前 URL 中提取 user-id 参数
        //     const urlParams = new URLSearchParams(window.location.search);
        //     const userId = urlParams.get('user-id');
        
        //     // 跳转回 index.html 并传递 user-id 参数
        //     window.location.href = `index.html?user-id=${userId}`;
        // }
        
        document.getElementById('ai-predict-button').addEventListener('click', function() {
            fetch(`${apiBaseUrl}/record/${diagnosisClass}/${recordId}`)
                .then(response => response.json())
                .then(data => {
                    // console.log(data)
                    displayPrediction(data);
                })
                .catch(error => {
                    console.error('Error fetching AI prediction:', error);
                });
        });

        function displayPrediction(data) {
            document.getElementById('prediction-panel').style.display = 'block';
    
            const tabs = document.querySelectorAll('.predict-tab');
            const contentDiv = document.getElementById('predict-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
    
                    contentDiv.innerHTML = '';
                    if (this.dataset.tab === 'activity-level') {
                        // 定义一个函数来返回SLEDAI的活动度说明
                        function getSLEDAIExplanation(sledai) {
                            if (sledai <= 4) {
                                return '病情基本无活动';
                            } else if (sledai <= 9) {
                                return '轻度活动';
                            } else if (sledai <= 14) {
                                return '中度活动';
                            } else {
                                return '重度活动';
                            }
                        }

                        // 定义一个函数来返回S加评分的说明
                        function getSPlusExplanation(s_plus) {
                            if (s_plus >= 33) {
                                return '严重';
                            } else if (s_plus < 26) {
                                return '轻度';
                            } else {
                                return '中度';
                            }
                        }

                        // 获取具体的解释
                        const sledaiExplanation = getSLEDAIExplanation(data.predict_sledai);
                        const sPlusExplanation = getSPlusExplanation(data.s_plus);

                        contentDiv.innerHTML = `
                            <h3>SLE病情活动度</h3>
                            <p>预测SLEDAI:${sledaiExplanation} (${data.predict_sledai})</p>
                            <p>0-4分为“病情基本无活动”，5-9分为“轻度活动”，10-14分为“中度活动”，≥15分为“重度活动”</p>
                            <p>S+评分: ${sPlusExplanation}(${data.s_plus})</p>
                            <p>大于等于33是“严重”，小于26是“轻度”，其余是“中度”。</p>
                        `;
                    } else if (this.dataset.tab === 'pca-visualization') {
                        renderPCAVisualization(data.pca_xy);
                    } else if (this.dataset.tab === 'diagnosis-prediction') {
                        const diagnosis = { 1: '可能患有SLE', 2: '可能患有CTD', 3: '可能患有RA' }[data.cls_result];
                        // 定义一个函数来返回风险等级
                        function getRiskLevel(probability) {
                            if (probability < 0.25) {
                                return '低';
                            } else if (probability < 0.5) {
                                return '中';
                            } else if (probability < 0.75) {
                                return '高';
                            } else {
                                return '极高';
                            }
                        }
                        // 获取风险等级并生成最终的内容
                        const pro_sle_risk = getRiskLevel(data.pro_sle);
                        const pro_ctd_risk = getRiskLevel(data.pro_ctd);
                        const pro_ra_risk = getRiskLevel(data.pro_ra);

                        contentDiv.innerHTML = `
                            <h3>诊断预测</h3>
                            <p>${diagnosis}</p>
                            <p>SLE的概率是: ${pro_sle_risk} (${data.pro_sle})</p>
                            <p>CTD的概率是: ${pro_ctd_risk} (${data.pro_ctd})</p>
                            <p>RA的概率是: ${pro_ra_risk} (${data.pro_ra})</p>
                        `;
                    } else if (this.dataset.tab === 'problem-indicators') {
                        // const problems = Object.entries(data.problem_dict)
                        //     .map(([id, description]) => `<li>${id}: ${description}</li>`)
                        //     .join('');
                        // contentDiv.innerHTML = `
                        //     <h3>问题指标</h3>
                        //     <ul>${problems}</ul>
                        // `;
                        // 假设 tableName.json 文件的路径是 'tableName.json'
                        fetch('tableName.json')
                        .then(response => response.json())
                        .then(tableData => {
                            // 创建一个映射表，将 id 映射到 nameCN
                            const idToNameCNMap = tableData.tables.reduce((map, table) => {
                                map[table.id] = table.nameCN;
                                return map;
                            }, {});

                            // 假设 data.problem_dict 是我们要处理的字典
                            const problems = Object.entries(data.problem_dict)
                                .map(([id, description]) => {
                                    // 获取映射后的 nameCN
                                    const nameCN = idToNameCNMap[id] || id;  // 如果映射不到，仍然使用 id
                                    // console.log(description)
                                    
                                    // 如果 description 为空，则跳过该项
                                    if (!description ||                             // 检查空值 null/undefined
                                        (Array.isArray(description) && description.length === 0)) return '';

                                    // 生成列表项
                                    return `<li>${nameCN}: ${description}</li>`;
                                })
                                .filter(item => item !== '') // 过滤掉空项
                                .join('');

                            // 将内容插入到页面中
                            contentDiv.innerHTML = `
                                <h3>问题指标</h3>
                                <ul>${problems}</ul>
                            `;
                        })
                        .catch(error => console.error('Error loading tableName.json:', error));

                    } else if (this.dataset.tab === 'medical-record') {
                        // const records = Object.entries(data.record_dict)
                        //     .map(([id, record]) => `<li>${id}: ${record}</li>`)
                        //     .join('');
                        // contentDiv.innerHTML = `
                        //     <h3>病历生成</h3>
                        //     <ul>${records}</ul>
                        // `;
                        fetch('tableName.json')
                        .then(response => response.json())
                        .then(tableData => {
                            // 创建一个映射表，将 id 映射到 nameCN
                            const idToNameCNMap = tableData.tables.reduce((map, table) => {
                                map[table.id] = table.nameCN;
                                return map;
                            }, {});

                            // 假设 data.record_dict 是我们要处理的字典
                            const records = Object.entries(data.record_dict)
                                .map(([id, recordArray]) => {
                                    // 获取映射后的 nameCN
                                    const nameCN = idToNameCNMap[id] || id; // 如果映射不到，仍然使用 id

                                    // 对每个 recordArray 进行处理，将测量结果格式化
                                    const formattedRecords = recordArray
                                        .map(record => {
                                            // 分割字符串，假设特征名字和测量结果用 ": " 分割
                                            const [feature, result] = record.split(': ');

                                            // 跳过 result 为 null 的项
                                            if (!result || result === 'None') return '';
                                            if (result === 'True' || result === 'False') {
                                                // 处理布尔值的情况
                                                if (feature === '性别') {
                                                    // 特殊处理性别
                                                    return `性别是${result === 'True' ? '男' : '女'}`;
                                                } else {
                                                    // 对其他特征的布尔值进行处理，true 表示有，false 表示无
                                                    return `${result === 'True' ? '有' : '无'}${feature}`;
                                                }
                                            }

                                            // 返回格式化的字符串
                                            return `${feature}的结果是${result}`;
                                        })
                                        .filter(item => item !== '') // 过滤掉空项
                                        .join('；'); // 使用中文分号 '；' 作为分隔符

                                    // 将每个病历条目生成一段文字
                                    if (!formattedRecords) return '';
                                    return `${nameCN}: ${formattedRecords}`;
                                })
                                .filter(item => item !== '') // 过滤掉空项
                                .join('\n\n'); // 使用双换行分隔每个病历条目

                            // 将内容插入到页面中的文本区域，类似于 textarea 的显示
                            contentDiv.innerHTML = `
                                <h3>病历生成</h3>
                                <pre style="white-space: pre-wrap;">${records}</pre>
                            `;
                        })
                        .catch(error => console.error('Error loading tableName.json:', error));

                    }
                });
            });
            tabs[0].click();
        }
        function renderPCAVisualization(patientPcaData) {
            const contentDiv = document.getElementById('predict-content');
            contentDiv.innerHTML = `
                <h3>PCA可视化</h3>
                <div id="pca-mode-buttons">
                    <button id="show-all">显示所有点集</button>
                    <button id="show-sle">显示SLE点集</button>
                    <button id="show-ctd">显示CTD点集</button>
                    <button id="show-ra">显示RA点集</button>
                </div>
                <canvas id="pca-canvas"></canvas>
                <div id="legend"></div>
                <div id="tooltip" style="position: absolute; background-color: white; border: 1px solid black; padding: 5px; display: none;"></div>
            `;
        
            const canvas = document.getElementById('pca-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 400;
            canvas.height = 400;
            let pointData = []; // 用于存储所有绘制的点及其坐标信息
            const tooltip = document.getElementById('tooltip');
        
            // 初始化图表，默认显示所有点集
            drawPCAChart(patientPcaData, 1);
        
            // 添加按钮点击事件监听器，用于切换不同的PCA图模式
            document.getElementById('show-all').addEventListener('click', () => drawPCAChart(patientPcaData, 1));
            document.getElementById('show-sle').addEventListener('click', () => drawPCAChart(patientPcaData, 2));
            document.getElementById('show-ctd').addEventListener('click', () => drawPCAChart(patientPcaData, 3));
            document.getElementById('show-ra').addEventListener('click', () => drawPCAChart(patientPcaData, 4));

            canvas.addEventListener('mousemove', (event) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
        
                // 查找鼠标附近的点
                const closestPoint = findClosestPoint(mouseX, mouseY, pointData);
        
                if (closestPoint) {
                    // 如果找到接近的点，显示tooltip
                    tooltip.style.display = 'block';
                    tooltip.style.left = `${event.clientX +10}px`;
                    tooltip.style.top = `${event.clientY +10}px`;
                    tooltip.innerHTML = `坐标: (${closestPoint.dataX.toFixed(2)}, ${closestPoint.dataY.toFixed(2)})`;
                } else {
                    tooltip.style.display = 'none';
                }
            });
        
        function drawPCAChart(patientPcaData, mode) {
            const canvas = document.getElementById('pca-canvas');
            const ctx = canvas.getContext('2d');
            const legendDiv = document.getElementById('legend');
            let legendHTML = '';
        
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            // 根据不同模式显示不同的数据
            fetch('pca_data.json')
                .then(response => response.json())
                .then(pcaData => {
                    if (mode === 1 || mode === 2) {
                        // SLE点集
                        ctx.fillStyle = 'blue';
                        legendHTML += '<p><span style="color: blue;">●</span> SLE患者</p>';
                        pcaData.sle.forEach(point => {
                            drawPoint(ctx, point[0], point[1], canvas, 3);
                        });
                    }
        
                    if (mode === 1 || mode === 3) {
                        // CTD点集
                        ctx.fillStyle = 'green';
                        legendHTML += '<p><span style="color: green;">●</span> CTD患者</p>';
                        pcaData.ctd.forEach(point => {
                            drawPoint(ctx, point[0], point[1], canvas, 3);
                        });
                    }
        
                    if (mode === 1 || mode === 4) {
                        // RA点集
                        ctx.fillStyle = 'orange';
                        legendHTML += '<p><span style="color: orange;">●</span> RA患者</p>';
                        pcaData.ra.forEach(point => {
                            drawPoint(ctx, point[0], point[1], canvas, 3);
                        });
                    }
        
                    // 绘制当前患者的PCA点
                    ctx.fillStyle = 'red';
                    legendHTML += '<p><span style="color: red;">●</span> 当前患者</p>';
                    drawPoint(ctx, patientPcaData[0], patientPcaData[1], canvas, 5);
        
                    // 更新图例
                    legendDiv.innerHTML = legendHTML;
                })
                .catch(error => console.error('Error loading PCA data:', error));
        }

        // function renderPCAVisualization(patientPcaData) {
        //     const contentDiv = document.getElementById('predict-content');
        //     contentDiv.innerHTML = `
        //     <h3>PCA可视化</h3>
        //     <div id="pca-mode-buttons">
        //     <button id="show-all">显示所有点集</button>
        //     <button id="show-sle">显示SLE点集</button>
        //     <button id="show-ctd">显示CTD点集</button>
        //     <button id="show-ra">显示RA点集</button>
        //     </div>
        //     <canvas id="pca-canvas"></canvas>
        //     <div id="legend"></div>`;
        
        //     const canvas = document.getElementById('pca-canvas');
        //     const ctx = canvas.getContext('2d');
        //     canvas.width = 400;
        //     canvas.height = 400;
        
        //     // Fetch the PCA data (assuming it's served as a static file)
        //     fetch('pca_data.json')
        //         .then(response => response.json())
        //         .then(pcaData => {
        //             // Draw the SLE points
        //             ctx.fillStyle = 'blue';
        //             pcaData.sle.forEach(point => {
        //                 drawPoint(ctx, point[0], point[1], canvas, 3);
        //             });
        
        //             // Draw the CTD points
        //             ctx.fillStyle = 'green';
        //             pcaData.ctd.forEach(point => {
        //                 drawPoint(ctx, point[0], point[1], canvas, 3);
        //             });
        
        //             // Draw the RA points
        //             ctx.fillStyle = 'orange';
        //             pcaData.ra.forEach(point => {
        //                 drawPoint(ctx, point[0], point[1], canvas, 3);
        //             });
        
        //             // Draw the patient's current PCA point
        //             ctx.fillStyle = 'red';
        //             drawPoint(ctx, patientPcaData[0], patientPcaData[1], canvas, 5);
        //         })
        //         .catch(error => console.error('Error loading PCA data:', error));
        // }
        
        // function drawPoint(ctx, x, y, canvas, radius) {
        //     const canvasX = canvas.width / 2 + x * 100;
        //     const canvasY = canvas.height / 2 - y * 100;
        //     ctx.beginPath();
        //     ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
        //     ctx.fill();
        // }
        function drawPoint(ctx, x, y, canvas, radius, color) {
            const canvasX = canvas.width / 2 + x * 100;
            const canvasY = canvas.height / 2 - y * 100;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
    
            // 记录每个点的实际坐标和画布坐标
            pointData.push({ canvasX, canvasY, dataX: x, dataY: y });
        }

        function findClosestPoint(mouseX, mouseY, points) {
            const maxDistance = 10; // 鼠标与点之间的最大距离
            let closestPoint = null;
            let closestDistance = maxDistance;
    
            points.forEach(point => {
                const distance = Math.sqrt((mouseX - point.canvasX) ** 2 + (mouseY - point.canvasY) ** 2);
                if (distance < closestDistance) {
                    closestPoint = point;
                    closestDistance = distance;
                }
            });
    
            return closestPoint;
        }
    }
        

    
});

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
    // breadcrumbHTML += `<li class="breadcrumb-item"><a href="http://localhost:8000/main-page.html">首页</a></li>`;
    breadcrumbHTML += `<li class="breadcrumb-item"><a href="https://bibulin.xyz/main-page.html">首页</a></li>`;
    if (userId) {
        breadcrumbHTML += `<li class="breadcrumb-item"><a href="https://bibulin.xyz/index.html?user-id=${userId}">个人主页</a></li>`;
    }

    if (recordId && testClass) {
        breadcrumbHTML += `<li class="breadcrumb-item"><a href="https://bibulin.xyz/choose-test.html?record-id=${recordId}&test-class=${testClass}&user-id=${userId}">选择测试</a></li>`;
    }

    if (tableId) {
        breadcrumbHTML += `<li class="breadcrumb-item active">填写表单 (Test #${tableId})</li>`;
    }

    breadcrumb.innerHTML = breadcrumbHTML;
});