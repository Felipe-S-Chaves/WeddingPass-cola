// =============================================
// LOGIN DO USUÁRIO
// =============================================
async function login(event) {
    // Impede o comportamento padrão do formulário (recarregar a página)
    event.preventDefault();

    const mail = document.getElementById("mailInput").value;
    const password = document.getElementById("passwordInput").value;

    if (!mail || !password) {
        alert("Preencha o email e a senha.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mail, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message); // Mostra o erro real do servidor
            return;
        }

        // Salva as informações do usuário no localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("full_name", data.full_name);

        // BUG CORRIGIDO: O alert vinha DEPOIS do redirect, nunca aparecia.
        // Agora o redirect vem depois.
        alert("Bem-vindo, " + data.full_name + "!");
        window.location.replace("../html/Dashboard.html");

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Erro ao conectar com o servidor.");
    }
}
