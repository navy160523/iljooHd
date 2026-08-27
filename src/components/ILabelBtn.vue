<script setup>
import { required } from '@hiway/utils/validation'
import { useI18n } from 'vue-i18n'
import initButtonItems from '@/utils/buttonList'

const props = defineProps({
  icon: {
    Type: String,
    default: 'mdi-circle-small',
  },
  iconSize: {
    Type: Number,
    default: 30,
  },
  label: {
    Type: String,
    default: '',
  },
  labelWidth: {
    Type: Number,
    default: 100,
  },
  required: {
    Type: Boolean,
    default: false,
  },
  labelLoc: {
    Type: String,
    default: 'left',
  },
  rules: {
    Type: Object,
    default: [],
  },
  usePermission: {
    Type : Boolean,
    default: false,
  },
  buttonList: {
    Type : Array,
    default: [],
  },
})

let buttonItems = reactive(initButtonItems(props.buttonList))

const emit = defineEmits(['click-button']) 

const clickButton = btn => {
  emit('click-button', btn)
}


const disableBtn = (id, disableYn) => {
  let buttonList = getButtonItems()
  let btn = buttonList.find(x => x.id == id)
  btn.disable = disableYn
}

const setBtnProperty = (id, propName, value) => {
  let buttonList = getButtonItems()
  let btn = buttonList.find(x => x.id == id)
  btn[propName] = value
}

const getButtonItems = () =>
{
  return buttonItems
}


defineExpose({
  setBtnProperty,
  getButtonItems,
  disableBtn,
}) 

let t = useI18n().t
  
const _labelWidth = props.labelLoc == 'left'? props.labelWidth + 'px' : '100%'
const _labelLoc = props.labelLoc == 'top'? 'block' : 'flex'
const _iconColor = props.required == true? 'red' : 'blue'

const editorProps = reactive({
  rules: [],
  hideDetails: true,
})

const labelWidthStyle = reactive({
  //minWidth: _labelWidth,
  //maxWidth: _labelWidth,
})

const labelLocStyle = reactive({
  display: _labelLoc,
})

const iconStyle = reactive({
  color: _iconColor,
  display: _iconColor,
  position: 'relative',
  top: '-7px',
  left: '-7px',
})

if (props.required) {
  editorProps.rules.push(required(t('필수값입니다.')))
}

props.rules.forEach(rule => {
  editorProps.rules.push(rule)
})
</script>

<template>
  <div
    class="form-item"
    :style="labelLocStyle"
  >
    <span
      v-if="labelLoc != 'none'"
      style="padding-right: 20px; text-wrap: nowrap;"
    >
      <!--
      <VIcon 
        :icon="icon"
        :size="iconSize"
        :style="iconStyle"
      />
      -->
      <span class="form-label">
        {{ label }}
      </span>
      <VIcon
        v-if="props.required==true"
        :icon="icon"
        :size="iconSize"
        :style="iconStyle"
      />
    </span>
    <slot
      name="editor"
      v-bind="editorProps"
    />
    <div 
    style=" height: 70px;"
    class="d-flex flex-column flex-md-row justify-center justify-md-space-between align-center" 
  >
    <div>
      <!--<VIcon v-if="title != ''" icon="" />-->
      <div style=" color:#222; display: inline-block; font-size: 18px; font-weight: 600;"> {{ title }} </div>
    </div>

    
  </div>
  <VSpacer></VSpacer>
  <div style="float:right">
      <VBtn
        v-for="btn in buttonItems"
        :id="btn.id"
        :key="`btn_${btn.id}`"
        v-permission="usePermission && !btn.permission ? [btn.id] : []"
        v-show="btn.visible"
        :prepend-icon="btn.icon"
        :disabled="btn.disable"
        class="titleBtn"
        @click="clickButton(btn)"
      >
        {{ $t(btn.text) }}
      </VBtn> 
    </div>
  </div>
  
</template>

<style>
.form-item {
  height: 100%;
  align-items: center;
  align-self: center;
  padding: 0px 15px;
}

.form-label {
  color: #222;
  font-size: 14px;
  font-weight: 400;
}

</style>