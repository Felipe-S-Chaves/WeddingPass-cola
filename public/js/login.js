// Realiza login do usuário
async function login(event) {

    // impede submit padrão do formulário
    event.preventDefault();

    const inputmail = document.getElementById("mailInput").value;
    const inputpassword = document.getElementById("passwordInput").value;

    try {

        const response = await fetch("http://localhost:3000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                mail: inputmail,
                password: inputpassword
            })

        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        // salva token
        localStorage.setItem("token", data.token);

        // salva role
        localStorage.setItem("role", data.role);

        // salva nome
        localStorage.setItem("full_name", data.full_name);

        // redireciona
        window.location.replace("../html/Dashboard.html");

        alert(data.full_name, "logado")

    } catch (error) {

        console.error(error);

        alert("Erro ao conectar com servidor");

    }

}