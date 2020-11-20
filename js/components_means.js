const components = ["body", "instincts", "heart", "mind"]
const means = ["perception", "action", "desire", "resistance"]

/* Update sum of means and component when one of them changes */

function update_sum(event) {
    const id = event.target.id
    const value = event.target.value
    const others = components.includes(id) ? means : components

    for (let i = 0; i < others.length; i++) {
        const sum_id = components.includes(id) ? "#" + id + "-" + others[i] : "#" + others[i] + "-" + id
        $(sum_id)[0].innerText = parseInt(value) + parseInt($("#" + others[i])[0].value)
    }
}

$(".means").on("change", update_sum)
$(".component").on("change", update_sum)
$(_ => {
    // Update the sum of components and means on load
    for (let i = 0; i < means.length; i++) {
        update_sum({target: $("#" + means[i])[0]})
    }
})
