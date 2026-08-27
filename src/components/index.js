import CardComponent from '@/components/common/CardComponent.vue'
import PopupComponent from '@/components/common/PopupComponent.vue'
import InputComponent from '@/components/common/InputComponent.vue'
import NumberComponent from '@/components/common/NumberComponent.vue'
import RegisterGridComponent from '@/components/grid/RegisterGridComponent.vue'
import CompoundGridComponent from '@/components/grid/CompoundGridComponent.vue'
import PermitGridComponent from '@/components/grid/PermitGridComponent.vue'
import DataGridComponent from '@/components/grid/DataGridComponent.vue'
import DatePickerComponent from '@/components/common/DatePickerComponent.vue'
import SelectboxComponent from '@/components/common/SelectboxComponent.vue'
import TextareaComponent from '@/components/common/TextareaComponent.vue'
import Echart from '@/components/echart/Echart.vue'

export default {
  install: (app) => {
    app.component('i-card', CardComponent)
    app.component('i-popup', PopupComponent)
    app.component('i-input', InputComponent)
    app.component('i-number', NumberComponent)
    app.component('i-register-grid', RegisterGridComponent)
    app.component('i-compound-grid', CompoundGridComponent)
    app.component('i-permit-grid', PermitGridComponent)
    app.component('i-data-grid', DataGridComponent)
    app.component('i-date-picker', DatePickerComponent)
    app.component('i-select', SelectboxComponent)
    app.component('i-textarea', TextareaComponent)
    app.component('eChart', Echart)
  }
}