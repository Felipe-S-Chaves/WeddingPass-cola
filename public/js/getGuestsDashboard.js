// =============================================
// DASHBOARD - GERENCIAMENTO DE CONVIDADOS
// =============================================

let chartInstance = null; // Guarda o gráfico para poder destruí-lo antes de recriar
let guestId = null;       // Guarda o ID do convidado sendo editado (null = novo convidado)

// Busca todos os convidados e atualiza a tabela e o gráfico
async function carregarConvidados() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch("http://localhost:3000/guests", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const erro = await response.json();
            alert("Erro ao carregar convidados: " + erro.message);
            return;
        }

        const convidados = await response.json();
        exibirConvidadosNaTabela(convidados);
        atualizarGrafico(convidados);

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Monta as linhas da tabela com os dados dos convidados
function exibirConvidadosNaTabela(convidados) {
    const tbody = document.getElementById("results");
    tbody.innerHTML = "";

    convidados.forEach(function(convidado) {
        const tr = document.createElement("tr");

        // BUG CORRIGIDO: O código original misturava <td> e <button> fora de <td>,
        // quebrando a estrutura da tabela HTML.
        tr.innerHTML = `
            <td>${convidado.id}</td>
            <td>${convidado.first_name} ${convidado.last_name}</td>
            <td>${convidado.mail}</td>
            <td>${convidado.phone}</td>
            <td>${convidado.table_number}</td>
            <td>
                ${convidado.check_ed == 1
                    ? `<button class="btn btn-success btn-sm" disabled>Check-in OK</button>`
                    : `<button class="btn btn-primary btn-sm" onclick="fazerCheckIn(${convidado.id})">Check-in</button>`
                }
            </td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="abrirEdicao(${convidado.id})" data-bs-toggle="modal" data-bs-target="#exampleModal">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deletarConvidado(${convidado.id})">Deletar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Atualiza o gráfico de pizza com os dados de check-in
function atualizarGrafico(convidados) {
    let totalCheckIn = 0;
    let totalPendente = 0;

    convidados.forEach(function(convidado) {
        if (convidado.check_ed === 1) {
            totalCheckIn++;
        } else {
            totalPendente++;
        }
    });

    const ctx = document.getElementById("myChart");

    // Destrói o gráfico anterior para não duplicar
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Check-in Realizado", "Pendente"],
            datasets: [{
                data: [totalCheckIn, totalPendente],
                backgroundColor: ["#90ee90", "#e2e20c"]
            }]
        },
        options: {
            title: {
                display: true,
                text: "Status de Check-in"
            }
        }
    });
}

// Deleta um convidado pelo ID
async function deletarConvidado(id) {
    const confirmar = confirm("Deseja realmente excluir este convidado?");
    if (!confirmar) return;

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`http://localhost:3000/guests/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const resultado = await response.json();

        if (!response.ok) {
            alert("Erro ao excluir: " + resultado.message);
            return;
        }

        alert("Convidado excluído com sucesso!");
        carregarConvidados();

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Abre o modal de edição preenchido com os dados do convidado
async function abrirEdicao(id) {
    guestId = id;

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`http://localhost:3000/guests/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            alert("Erro ao buscar convidado.");
            return;
        }

        const convidado = (await response.json())[0];

        document.getElementById("first_name").value = convidado.first_name;
        document.getElementById("last_name").value = convidado.last_name;
        document.getElementById("cpf").value = convidado.cpf;
        document.getElementById("mail").value = convidado.mail;
        document.getElementById("phone").value = convidado.phone;
        document.getElementById("table_number").value = convidado.table_number;
        document.getElementById("exampleModalLabel").textContent = "Editar Convidado";

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Prepara o modal para adicionar um novo convidado
function novoGuest() {
    guestId = null;
    limparFormulario();
    document.getElementById("exampleModalLabel").textContent = "Adicionar Convidado";
}

// Salva o convidado (cria novo ou atualiza existente)
async function salvarConvidado() {
    const token = localStorage.getItem("token");

    const convidado = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        cpf: document.getElementById("cpf").value,
        mail: document.getElementById("mail").value,
        phone: document.getElementById("phone").value,
        table_number: document.getElementById("table_number").value,
        check_ed: 0
    };

    // Se guestId existe, é edição (PUT). Se não, é criação (POST).
    const url = guestId
        ? `http://localhost:3000/guests/${guestId}`
        : "http://localhost:3000/guests";

    const method = guestId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(convidado)
        });

        const resultado = await response.json();

        if (!response.ok) {
            alert("Erro ao salvar: " + resultado.message);
            return;
        }

        // Fecha o modal do Bootstrap
        bootstrap.Modal.getInstance(document.getElementById("exampleModal")).hide();

        guestId = null;
        limparFormulario();
        carregarConvidados();

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Realiza o check-in direto pelo dashboard
async function fazerCheckIn(id) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`http://localhost:3000/guests/${id}/checkin`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const resultado = await response.json();

        if (!response.ok) {
            alert("Erro: " + resultado.message);
            return;
        }

        carregarConvidados();

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Limpa todos os campos do formulário do modal
function limparFormulario() {
    document.getElementById("first_name").value = "";
    document.getElementById("last_name").value = "";
    document.getElementById("cpf").value = "";
    document.getElementById("mail").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("table_number").value = "1";
}

// Exporta a lista de convidados para PDF
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Wedding Pass - Lista de Convidados", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    const linhas = [];
    const tbody = document.getElementById("results");
    const trs = tbody.querySelectorAll("tr");

    trs.forEach(function(tr) {
        const tds = tr.querySelectorAll("td");
        if (tds.length >= 6) {
            // Verifica o status pelo botão desativado
            const botaoStatus = tds[5].querySelector("button");
            const status = botaoStatus && botaoStatus.disabled ? "Check-in OK" : "Pendente";

            linhas.push([
                tds[0].textContent.trim(), // ID
                tds[1].textContent.trim(), // Nome
                tds[2].textContent.trim(), // Email
                tds[3].textContent.trim(), // Telefone
                tds[4].textContent.trim(), // Mesa
                status
            ]);
        }
    });

    doc.autoTable({
        startY: 38,
        head: [["ID", "Nome", "Email", "Telefone", "Mesa", "Status"]],
        body: linhas,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 37, 41] }
    });

    doc.save("wedding_pass_convidados.pdf");
}

// Carrega os convidados ao abrir a página
carregarConvidados();
