// =============================================
// RECEPÇÃO - CHECK-IN DE CONVIDADOS
// =============================================

// Busca todos os convidados e exibe na tabela
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

        // BUG CORRIGIDO: Antes o erro era genérico ("Response status: X").
        // Agora mostramos a mensagem real do servidor.
        if (!response.ok) {
            const erro = await response.json();
            alert("Erro ao carregar convidados: " + erro.message);
            return;
        }

        const convidados = await response.json();
        exibirConvidadosNaTabela(convidados);

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Monta as linhas da tabela com os dados dos convidados
function exibirConvidadosNaTabela(convidados) {
    const tbody = document.getElementById("results");
    tbody.innerHTML = ""; // Limpa a tabela antes de preencher

    convidados.forEach(function(convidado) {
        const tr = document.createElement("tr");

        // BUG CORRIGIDO: O código anterior criava um <tr> dentro de outro <tr>,
        // pois usava divConvidado = createElement("tr") mas colocava <tr> no innerHTML.
        tr.innerHTML = `
            <td>${convidado.id}</td>
            <td>${convidado.first_name} ${convidado.last_name}</td>
            <td>${convidado.phone}</td>
            <td>${convidado.table_number}</td>
            <td>${convidado.check_ed == 1 ? "Check-in realizado" : "Pendente"}</td>
            <td>
                ${convidado.check_ed == 1
                    ? `<button class="btn btn-success btn-sm" disabled>Check-in realizado</button>`
                    : `<button class="btn btn-primary btn-sm" onclick="fazerCheckIn(${convidado.id})">Realizar Check-in</button>`
                }
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Realiza o check-in de um convidado pelo ID
// BUG CORRIGIDO: Antes usava PUT /guests/:id passando todos os campos do convidado,
// o que falhava se o role fosse "recepcionist" (pois PUT só permitia "admin").
// Agora usa PATCH /guests/:id/checkin, que é dedicado ao check-in e permite recepcionistas.
async function fazerCheckIn(id) {
    const confirmar = confirm("Confirmar check-in deste convidado?");
    if (!confirmar) return;

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
            // Mostra a mensagem real do erro (ex: "Check-in já realizado")
            alert("Erro: " + resultado.message);
            return;
        }

        alert(resultado.message); // "Check-in realizado com sucesso"
        carregarConvidados(); // Recarrega a tabela

    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Busca convidados pelo nome (filtro de pesquisa)
function filtrarConvidados() {
    const termoBusca = document.getElementById("campoBusca").value.toLowerCase();
    const linhas = document.querySelectorAll("#results tr");

    linhas.forEach(function(linha) {
        const nome = linha.cells[1] ? linha.cells[1].textContent.toLowerCase() : "";
        if (nome.includes(termoBusca)) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }
    });
}

// Carrega os convidados assim que a página abre
carregarConvidados();
