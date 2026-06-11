async function getData() {

    const url = "http://localhost:3000/guests";

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(url, {

            method: "GET",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }

        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        const results = document.getElementById("results")
        results.innerHTML = ""
        result.forEach(convidado => {
            const divConvidado = document.createElement("tr")

            divConvidado.innerHTML = `
            <tr>
                  <td>${convidado.id}</td>
                  <td>${convidado.first_name + " " + convidado.last_name}</td>
                  <td>${convidado.phone}</td>
                  <td>${convidado.table_number}</td>
                  <td>${convidado.check_ed == 1 ? "Check-in realizado" : "Pendente"}</td>
                  <td>
                    ${convidado.check_ed == 1 ? `<button class="btn btn-success" disabled>
                                Check-in realizado
                            </button>`: `<button class="btn btn-primary check-in-btn" data-id="${convidado.id}">
                                Realizar Check-in
                            </button>`
                                    }
                    </td>
                </tr>
        
            `;
            results.appendChild(divConvidado)

        }


        );
    } catch (error) {

        console.error(error.message);

    }
}

getData()



