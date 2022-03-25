let ap_computation_event = null
const AP_COMPUTATION_THROTTLE = 100 // ms

// Throttle costly AP computation
function compute_remaining_ap() {
    if (ap_computation_event != null) {
        clearTimeout(ap_computation_event)
    }
    ap_computation_event = setTimeout(() => sheet["ap"].do_compute_remaining_ap(), AP_COMPUTATION_THROTTLE)
}

class AdventurePoints extends Model {
    static requirements = ["characteristics", "status"]

    static numeric_inputs = discovery ? []
        : (intermediate_discovery ? ["adventure-points"] : ["adventure-points", "adventure-points-discount"])
    static basic_inputs = [...this.numeric_inputs]
    static selects = intermediate_discovery ? [] : ["energies-started-level-2", "work-main-talent", "work-talents"]
    static selects_no_sanitize = intermediate_discovery ? [] : ["energies-started-level-2"]

    add_listeners() {
        super.add_listeners()
        if (intermediate_discovery) {
            this.find("#investment-table td[data-toggle='tooltip']").each((i, elem) => {
                $(elem).tooltip()
            })
        }

        for (const id of this.constructor.basic_inputs) {
            this.get(id).on("change", compute_remaining_ap)
        }

        for (const id of this.constructor.selects) {
            const elem = this.get(id)
            if (elem.hasClass("talent-select"))
                elem.on("changed.bs.select", (e, clickedIndex, isSelected, previousValue) => {
                    // Retrieve all talents that were selected or removed
                    let talents_to_update = $(e.target).selectpicker("val")
                    if (!Array.isArray(talents_to_update))
                        talents_to_update = [talents_to_update]
                    if (previousValue) {
                        if (!Array.isArray(previousValue))
                            previousValue = [previousValue]
                        for (let i = 0; i < previousValue.length; i++) {
                            if (!talents_to_update.includes(previousValue[i]))
                                talents_to_update.push(previousValue[i])
                        }
                    }

                    sheet.talents().filter((talent) => {
                        return talents_to_update.includes(talent.name)
                    }).forEach((talent) => {
                        for (let i = 0; i < talents_to_update.length; i++) {
                            talent.update_talent_tooltip()
                        }
                    })
                    compute_remaining_ap()
                })
            else
                elem.on("changed.bs.select", compute_remaining_ap)
        }
    }

    main_work_talents() {
        return multiselect_to_array(this["work-main-talent"])
    }

    work_talents() {
        return multiselect_to_array(this["work-talents"])
    }

    advised_talent() {
        return []
    }

    talent_x_inefficient_raise() {
        return []
    }

    compute_component_means_cost() {
        if (!sheet)
            return 0
        let characteristics = sheet["characteristics"]
        let consumed_points = 0

        // Components
        let sum_points = 0
        let raised_to_6 = 0
        Characteristics.components.forEach(elem => {
            sum_points += characteristics[elem]
            if (parseInt(characteristics[elem]) === 6)
                raised_to_6 += 1
        })
        if (sum_points > start_components)
            consumed_points += (sum_points - start_components) * component_ap_cost

        // V8-only: Add costs for components raised to 6 (but not at the start of the campaign)
        if (!is_v7) {
            raised_to_6 -= multiselect_to_array(this["components-started-level-6"]).length
            if (raised_to_6 > 0)
                consumed_points += raised_to_6 * (component_5_to_6_ap_cost - component_ap_cost)
        }

        // Do not reload the tooltip if the cost did not change
        if (!characteristics["component_ap_cost"] || characteristics["component_ap_cost"] !== consumed_points) {
            const title = $("#component-title")
            if (title.length > 0 && !intermediate_discovery) {
                title[0].setAttribute("title", "Coût des composantes: " + consumed_points + " PA")
                title.tooltip("dispose")
                title.tooltip()
            }
            characteristics["component_ap_cost"] = consumed_points
        }

        // Means
        sum_points = 0
        let means_cost = 0
        Characteristics.means.forEach(elem => {
            sum_points += characteristics[elem]
        })
        if (sum_points > start_means)
            means_cost += (sum_points - start_means) * means_ap_cost
        consumed_points += means_cost

        if (!characteristics["means_ap_cost"] || characteristics["means_ap_cost"] !== consumed_points) {
            const title = $("#means-title")
            if (title.length > 0 && !intermediate_discovery) {
                title[0].setAttribute("title", "Coût des moyens: " + means_cost + " PA")
                title.tooltip("dispose")
                title.tooltip()
            }
            characteristics["means_ap_cost"] = consumed_points
        }
        return consumed_points
    }

    compute_status_cost() {
        if (!sheet)
            return 0
        const characteristics = sheet["characteristics"]
        const status = sheet.status
        let consumed_points = 0
        // Breath
        let max_breath = status["breath.max"]
        if (characteristics["heart." + bonus_applied]) { // +1 due to heart value
            max_breath -= 1
        }
        if (characteristics["instincts." + bonus_applied]) { // +1 due to instincts value
            max_breath -= 1
        }
        max_breath -= status["temporary-breath"] || 0 // can disappear
        max_breath += status["lost-breath"]
        let diff = (max_breath - start_breath) * breath_ap_cost
        consumed_points += diff
        if (status["breath_ap_cost"] !== diff) {
            let title = $("#breath-title")
            if (title.length > 0 && !intermediate_discovery) {
                title[0].setAttribute("title", "Coût: " + diff + " PA")
                title.tooltip("dispose")
                title.tooltip()
            }
            status["breath_ap_cost"] = diff
        }

        // Psychic balance
        let max_psychic = status["psychic.max"]
        if (characteristics["mind." + bonus_applied]) { // +1 due to mind value
            max_psychic -= 1
        }
        max_psychic += status["lost-psychic"]
        diff = (max_psychic - start_psychic_balance) * psychic_balance_ap_cost
        consumed_points += diff
        if (status["psychic_ap_cost"] !== diff) {
            let title = $("#psychic-title")
            if (title.length > 0 && !intermediate_discovery) {
                title[0].setAttribute("title", "Coût: " + diff + " PA")
                title.tooltip("dispose")
                title.tooltip()
            }
            status["psychic_ap_cost"] = diff
        }
        return consumed_points
    }

    talents_cost() {
        let consumed_points = 0
        sheet.talents().forEach((talent) => {
            const cost = talent.talent_cost()[0]
            if (!isNaN(cost))
                consumed_points += cost
        })
        return consumed_points
    }

    monk_power_cost() {
        if (!sheet)
            return 0
        let consumed_points = 0
        let ki_rows = sheet["ki_powers"].rows
        ki_rows.forEach(elem => {
            let diff = 0
            if (elem.level > 1 && elem.level <= 3) {
                diff = (elem.level - 1) * power_level_ap_cost
                consumed_points += diff
            }

            // Do not update if the cost did not change
            if (!elem["ap_cost"] || elem["ap_cost"] !== diff) {
                let title = elem.data.children().first()
                if (title.length > 0 && !intermediate_discovery) {
                    title.each((i, elem) => elem.setAttribute("title", "Coût: " + diff + " PA"))
                    title.tooltip("dispose")
                    title.tooltip()
                }
                elem["ap_cost"] = diff
            }
        })
        return consumed_points
    }

    do_compute_remaining_ap() {
    }
}
