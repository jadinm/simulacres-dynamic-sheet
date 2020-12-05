function slider_max(slider) {
    return parseInt(slider.getAttribute("data-slider-max"))
}

/* This build the formatter '{value}/{maximum}' */
function build_max_formatter(input) {
    return (value) => {
        return value + "/" + slider_max(input)
    }
}

function activate_slider(input, formatter_builder = build_max_formatter, post_build = _ => void 0, opts={}) {
    // Remove pre-existing sliders (this happens after a save of the html page)
    const elem = "#" + input.getAttribute("data-slider-id")
    $(elem).remove()
    input.setAttribute("style", {})

    opts["formatter"] = formatter_builder(input)

    const orientation = input.getAttribute("data-slider-reversed")
    if (orientation != null && orientation === "true") {
        // We need to manually change the orientation of the active selection bar because vertically,
        // it would not make sense if the green bar is from top to bottom
        opts["selection"] = "after"
    }
    const slider = $(input).slider(opts)
    post_build(slider)
}

function set_slider_max(slider, value) {
    slider.slider("setAttribute", "max", value)
    slider[0].setAttribute("data-slider-max", value.toString())
    slider.slider("refresh", {useCurrentValue: true})
}

function set_slider_min(slider, new_min) {
    // Update current value by the difference between old min and new min
    const old_min = parseInt(slider.slider("getAttribute", "min"))
    const old_value = parseInt(slider[0].value)
    const new_value = old_value + new_min - old_min
    slider[0].value = new_value
    slider.slider("setAttribute", "value", new_value)

    // Update the minimum
    slider.slider("setAttribute", "min", new_min)
    slider[0].setAttribute("data-slider-min", new_min.toString())
    slider.slider("refresh")
}
