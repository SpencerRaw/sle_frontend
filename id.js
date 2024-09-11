// const apiBaseUrl = 'http://10.10.8.225:8000';
const apiBaseUrl = 'https://sle-backend.onrender.com';

// 添加新的DOMContentLoaded监听器，专门处理面包屑导航
document.getElementById('sidebar-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

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
        breadcrumbHTML += `<li class="breadcrumb-item active">填写表单 (Test #${tableId})</li>`;
    }

    breadcrumb.innerHTML = breadcrumbHTML;
});
// document.getElementById('sidebar-toggle').addEventListener('click', function() {
//     document.getElementById('sidebar').classList.toggle('active');
// });

document.addEventListener("DOMContentLoaded", async function() {
    // 获取URL中的user-id参数
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user-id');
    // const apiBaseUrl = 'http://10.10.8.225:8000';
    const apiBaseUrl = 'https://sle-backend.onrender.com';

    // 调用API获取用户姓名
    try {
        const response = await fetch(`${apiBaseUrl}/user/${userId}/`);
        const result = await response.json();

        if (response.ok) {
            // 显示用户姓名
            document.getElementById("user-name").innerText = result.user_name;
        } else {
            alert("无法获取用户信息：" + result.detail);
        }
    } catch (error) {
        alert("获取用户信息时出错：" + error);
    }

    // 处理退出登录按钮的点击事件
    document.getElementById("logout-button").addEventListener("click", function() {
        // 退出登录逻辑（这里可以清除登录状态）
        window.location.href = "main-page.html";  // 返回到主页
    });

    // 获取记录列表
    fetchRecords(userId);
});


async function fetchRecords(userId) {
    const response = await fetch(`${apiBaseUrl}/records?user_id=${userId}`);
    // TO DO:特定user的召集
    const records = await response.json();

    // console.log(records)

    const container = document.getElementById('records-container');
    container.innerHTML = ''; 
    records.sort((a, b) => b.record_id - a.record_id);
    records.forEach(record => {
        const card = document.createElement('div');
        card.classList.add('record-card'); // 样式类
        // console.log(record.patient_name)

        // 显示record-id和修改时间
        card.innerHTML = `
            <p>诊断ID: ${record.record_id}</p>
            <p>患者姓名: ${record.patient_name}</p>
            <p>最近修改: ${record.last_checkout}</p>
            <button onclick="goToTest(${record.record_id}, 1,${userId})">基本</button>
            <button onclick="goToTest(${record.record_id}, 2,${userId})">深度</button>
            <button onclick="goToTest(${record.record_id}, 3,${userId})">影像</button>
            <button onclick="deleteRecord(${record.record_id})">删除</button>
        `;

        container.appendChild(card);
    });

}
function goToTest(recordId, testClass,userId) {
    window.location.href = `choose-test.html?record-id=${recordId}&test-class=${testClass}&user-id=${userId}`;
}

// 添加新记录
document.getElementById('add-record-btn').addEventListener('click', async () => {
    const patientName = document.getElementById('patient-name-input').value.trim();
    
    if (!patientName) {
        alert('请输入患者姓名');
        return;
    }

    const publishedDate = new Date().toISOString().split('T')[0]; // 获取当前日期
    // const userId = new URLSearchParams(window.location.search).get('user-id');
    const userId = parseInt(new URLSearchParams(window.location.search).get('user-id'));
    console.log(JSON.stringify({ 
        published_date: publishedDate, 
        patient_name: patientName, 
        user_id: userId // 传递user_id 
    }))

    const response = await fetch(`${apiBaseUrl}/add_record/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            published_date: publishedDate, 
            patient_name: patientName, 
            user_id: userId // 传递user_id 
        }),
    });
    const result = await response.json();
    alert(`New record added with ID: ${result.id}`);
    fetchRecords(userId); // 重新获取记录并刷新页面
});

// 处理搜索输入框的事件，实时筛选卡片
document.getElementById('search-input').addEventListener('input', function() {
    const searchTerm = this.value.trim().toLowerCase();
    const cards = document.querySelectorAll('.record-card');

    cards.forEach(card => {
        const patientName = card.querySelector('p:nth-child(2)').textContent.toLowerCase();
        if (patientName.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// 删除记录
async function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this record?')) {
        const response = await fetch(`${apiBaseUrl}/delete_record/${recordId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        alert(result.message);
        const userId = new URLSearchParams(window.location.search).get('user-id'); // 获取user_id
        fetchRecords(userId); // 重新获取记录并刷新页面
    }
}


// window.onload = fetchRecords;