<template>
  <div class="align-center inputBox">
    <div
      v-if="props.label || props.topLabel"
      class="title formLabelText d-flex"
    >
      {{ props.label }}
      <svg-icon v-if="props.required" class="dot" name="redDot"></svg-icon>
    </div>
    <slot name="between-inner"></slot>
    <!-- :min="props.min!==null?props.min:''"
    :max="props.max!==null?props.max:''" -->
    <v-textarea
      variant="outlined"
      color="primary"
      base-color="inputDisabled"
      :bg-color="props.bgColor"
      v-model="input"
      @input="handleInput"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :placeholder="props.placeholder"
      :rows="props.row"
      :maxlength="props.maxlength"
    >
    </v-textarea>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue"
const props = defineProps({
  counter: { type: Number, default: 50 },
  label: { type: String, default: null }, //라벨 이름
  width: { type: String, default: "500px" }, //전체 넓이
  labelWidth: { type: String, default: "auto" }, // title 영역 넓이
  icon: { type: String, default: "" }, // icon
  required: { type: Boolean, default: false }, //필수입력값
  disabled: { type: Boolean, default: false }, //disable 처리
  modelValue: { type: [String, Number], default: "" }, //V-Model
  justify: { type: String, default: "start" }, //라벨 가운데 정렬 여부 (start, end, center)
  // min: {type:Number, default:null}, // 최소값 (type:number 일 떄)
  // max: {type:Number, default:null}, //최대값 (type:number 일 때)
  type: { type: String, default: null }, // 타입
  readonly: { type: Boolean, default: false }, //readonly
  placeholder: { type: String, default: null },
  margin: { type: String, default: "20px" }, //오른쪽 마진
  marginBetween: { type: String, default: "8px" }, // 라벨과 인풋 사이 마진 (between-inner 슬롯 사용시)
  maxlength: { type: String, default: "" }, // 최대 문자 입력 수
  row: { type: Number, default: 5 }, // 기본 높이(줄바꿈 갯수)
  bgColor: { type: String, default: '#fff' }
})
const width = computed(() => {
  return props.width
})
const margin = computed(() => {
  return props.margin
})
const marginBetween = computed(() => {
  return props.marginBetween
})

const input = ref(props.modelValue)

watch(
  () => props.modelValue,
  () => {
    input.value = props.modelValue
  }
)

const emit = defineEmits(["update:modelValue"])
const handleInput = (e) => {
  emit("update:modelValue", input.value)
}
</script>

<style scoped lang="scss">
.dot {
  justify-content: normal !important;
  align-items: normal !important;
}
.inputBox {
  min-width: v-bind(width) !important;
  width: v-bind(width) !important;
  margin-right: v-bind(margin);
  .title {
    max-height: 20px;
    height: 20px;
    min-width: v-bind(labelWidth) !important;
    width: v-bind(labelWidth);
    justify-content: v-bind(justify);
    margin-right: v-bind(marginBetween) !important;
  }
  :deep(.v-field) {
    --v-field-padding-end: 0px !important;
  }
}
</style>
