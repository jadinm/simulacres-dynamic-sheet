/* Update the spell difficulty */

const row_id_regex = /(\w+-(x|\d+))-?(.*)/

function row(base_elem) {
    const base_id = base_elem.id.match(row_id_regex)[1]
    return $("#" + base_id)
}

function row_elem(base_elem, element_id_suffix) {
    const base_id = base_elem.id.match(row_id_regex)[1]
    return $("#" + base_id + "-" + element_id_suffix)
}

/* Add new rows to tables */

function add_row(table, new_elem) {
    // Increment the spell id
    let max_tr_id = -1
    table.children().each((i, elem) => {
        let old_value = elem.id.split("-").pop()
        if (old_value === "x")
            old_value = "-1"
        max_tr_id = Math.max(parseInt(old_value), max_tr_id)
    })
    const new_id = max_tr_id + 1

    new_elem.find("*[id*=-x-]").each((i, elem) => {
        elem.id = elem.id.replace("-x-", "-" + new_id + "-")
    })
    new_elem.find("*[name*=-x-]").each((i, elem) => {
        elem.setAttribute("name", elem.getAttribute("name").replace("-x-", "-" + new_id + "-"))
    })
    new_elem.find("*[for*=-x-]").each((i, elem) => {
        elem.setAttribute("for", elem.getAttribute("for").replace("-x-", "-" + new_id + "-"))
    })
    new_elem.find("*[data-slider-id*=-x-]").each((i, elem) => {
        elem.setAttribute("data-slider-id", elem.getAttribute("data-slider-id").replace("-x-", "-" + new_id + "-"))
    })
    new_elem[0].id = new_elem[0].id.replace("-x", "-" + new_id)
    table.append(new_elem)
    new_elem.removeAttr("hidden")

    return new_id
}

/* Add new equipment, spell and roll rows */

$("#add-focus").on("click", _ => {
    add_row($("#focus-table"), $("#focus-x").clone(true, true))
})

$("#add-magical-equipment").on("click", _ => {
    add_row($("#magical-equipment-table"), $("#magical-equipment-x").clone(true, true))
})

$("#add-equipment").on("click", _ => {
    add_row($("#equipment-table"), $("#equipment-x").clone(true, true))
})

$('#roll-table,#spell-table,#focus-table,#magical-equipment-table,#equipment-table').sortable({
    handle: '.fa-arrows-alt',
    dragoverBubble: true
})
