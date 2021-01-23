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
