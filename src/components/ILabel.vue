<script setup>
import { computed, onActivated, onMounted, onUpdated, reactive } from "vue"
import { required } from '@hiway/utils/validation'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  icon: {
    type: String,
    default: 'mdi-circle-small',
  },
  iconSize: {
    type: Number,
    default: 30,
  },
  label: {
    type: String,
    default: '',
  },
  // labelWidth: {
  //   type: Number,
  //   default: 100,
  // },
  required: {
    type: Boolean,
    default: false,
  },
  labelLoc: {
    type: String,
    default: 'left',
  },
  rules: {
    type: Object,
    default() {
      return []
    },
  },
  textPadding: {
    type: String,
    default: '0', // 1글자 차이당 12px
  },
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
  position: 'absolute',
  top: '-12px',
  right: '0',
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
      style="padding-right: 20px; text-wrap: nowrap; position: relative;"
    >
      <!--
      <VIcon 
        :icon="icon"
        :size="iconSize"
        :style="iconStyle"
      />
      -->
      <span
        class="form-label"
        :style="{ 'padding-right': props.textPadding }"
      >
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