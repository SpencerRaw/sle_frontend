// const apiBaseUrl = 'http://10.10.8.225:8000';
const apiBaseUrl = 'https://sle-backend.onrender.com';
// 打开弹窗函数
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// 关闭弹窗函数
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
// 监听按钮点击事件
document.getElementById('login-btn').addEventListener('click', function() {
    openModal('login-modal');
});

document.getElementById('register-btn').addEventListener('click', function() {
    openModal('register-modal');
});

// 监听关闭按钮点击事件
document.getElementById('close-login').addEventListener('click', function() {
    closeModal('login-modal');
});

document.getElementById('close-register').addEventListener('click', function() {
    closeModal('register-modal');
});

document.getElementById("register").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("register-name").value;
    const phone = document.getElementById("register-phone").value;
    const password = document.getElementById("register-password").value;

    const response = await fetch(`${apiBaseUrl}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            phone: phone,
            password: password
        })
    });

    const result = await response.json();
    if (response.ok) {
        alert("注册成功！请登录。");
        // 清空注册表单
        document.getElementById("register").reset();
    } else {
        alert("注册失败：" + result.detail);
    }
});

document.getElementById("login").addEventListener("submit", async function (event) {
    event.preventDefault();

    const phone = document.getElementById("login-phone").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch(`${apiBaseUrl}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            phone: phone,
            password: password
        })
    });

    const result = await response.json();
    if (response.ok) {
        // 登录成功，跳转到用户主页
        window.location.href = `index.html?user-id=${result.user_id}`;
    } else {
        alert("登录失败：" + result.detail);
    }
});
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



