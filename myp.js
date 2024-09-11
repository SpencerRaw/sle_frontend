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
});
