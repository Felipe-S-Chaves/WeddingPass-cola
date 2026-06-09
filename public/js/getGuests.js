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
                  <td>${convidado.first_name}</td>
                  <td>${convidado.last_name}</td>
                  <td>${convidado.mail}</td>
                  <td>${convidado.table_number}</td>
                  <td>${convidado.check_ed}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-warning" data-bs-toggle="modal"
                      data-bs-target="#exampleModal">Edit</button>
                    <button type="button" class="btn btn-sm btn-danger">Delete</button>
                  </td>
                </tr>
        
            `;
            results.appendChild(divConvidado)

            const ctx = document.getElementById('myChart');
            let checked = 0;
            let pendent = 0
            for (let i = 0; i < result.length; i++) {
                if (result[i].check_ed === 0){
                    checked++;
                }else{
                    pendent++
                }
            }
            

            console.log(checked, pendent); // 6

            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ["checked", "not checked"],
                    datasets: [{
                        data: [pendent, checked ],
                        backgroundColor: [
                            '#90ee90',
                            '#e2e20c'
                        ]
                    }]
                }
            });
        }


        );
    } catch (error) {

        console.error(error.message);

    }
}

getData()



