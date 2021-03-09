function update_equipment_selects() {
    const equipment_list = $("#equipment-table tr,#focus-table tr,#magical-equipment-table tr,#limitedUse-equipment-table tr").filter((i, e) => {
        const row = row_of(e)
        const name = row.get("name")
        return name.val() && name.val().length > 0
    }).map((i, e) => {
        const row = row_of(e)
        const name = row.get("name")
        return {name: name.val(), content: null, value: row.id}
    })
    equipment_list.push({name: "", content: null, value: null})

    $("select.equipment-select").each((i, elem) => {
        update_select($(elem), equipment_list)
    })
}

$("#copper-currency").on("change", e => {
    const currency = $(e.target).val()
    if (currency)
        $(".price-currency").text("(" + currency + ")")
    else
        $(".price-currency").text("")
})

$(_ => {
    $("#copper-currency").trigger("change")
})
