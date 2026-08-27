<template>
  <div
    class="align-center selectBox"
    :class="props.topLabel ? '' : 'displayFlex'"
  >
    <div
      v-if="props.label || props.topLabel"
      class="title formLabelText d-flex"
    >
      {{ props.label }}
      <svg-icon v-if="props.required" class="dot" name="redDot"></svg-icon>
    </div>
    <slot name="between-inner"></slot>
    <VAutocomplete
      v-model="select"
      :items="props.type === 'YEAR' || props.type === 'YEAR_ALL' || props.type === 'MM' ? props2.items : props.items"
      variant="outlined"
      color="primary"
      base-color="inputDisabled"
      :bg-color="props.bgColor"
      :item-props="props.itemProps"
      :disabled="props.disabled"
      :item-value="props.itemValue"
      :item-title="props.itemTitle"
      :placeholder="props.placeholder"
      :readonly="props.readonly"
      :multiple="props.multiple"
      :type="props.type"
      :suffix="props.suffix"
      @update:model-value="handleSelect"
    ></VAutocomplete>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  itemProps: { type: Function, default: () => {} },
  topLabel: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false }, // 2024.02.28 박용훈 멀티 추가
  itemValue: { type: String, default: null }, // 코드
  itemTitle: { type: String, default: null },
  label: { type: String, default: null }, // span의 텍스트
  width: { type: String, default: "500px" }, // 전체 너비
  disabled: { type: Boolean, default: false }, //disable 처리
  labelWidth: { type: String, default: "auto" }, // span 너비
  required: { type: Boolean, default: false }, //필수입력값
  items: { type: Array, default: () => [] }, // 셀렉트박스에서 선택 가능한 요소 배열
  //modelValue: { type: String, default: "" }, //셀렉트박스 v-model, v-model 내부 값이 null인 상태로 전달 시 자동으로 items 내의 맨 첫 번째 요소를 선택한 상태로 지정함
  modelValue: { type: [String, Array], default: "" },
  justify: { type: String, default: "start" }, // span 정렬
  margin: { type: String, default: "20px" }, //오른쪽 마진
  marginBetween: { type: String, default: "8px" }, // 라벨과 셀렉트박스 사이 마진 (between-inner 슬롯 사용시)
  placeholder: { type: String, default: null },
  type: { type: String, default: null }, // 2024.03.07 박용훈 type으로 가공 하기 위해 추가
  suffix: { type: String, default: "" },
  bgColor: { type: String, default: '#fff' },
  minYear: { type: Number, default: 1973 }
})

// 2024.03.07 박용훈 이 페이지에서 items를 다시 세팅 하기 위해 추가
const props2 = reactive({
  items: [],
})
const initCodeList = () => {}

const width = computed(() => {
  return props.width
})
const labelWidth = computed(() => {
  return props.labelWidth
})
const justify = computed(() => {
  return props.justify
})
const margin = computed(() => {
  return props.margin
})

const marginBetween = computed(() => {
  return props.marginBetween
})

const select = ref(props.modelValue)
watch(
  () => props.modelValue,
  () => {
    select.value = props.modelValue
  }
)

// 2024.03.07 박용훈 ytpe을 받아서 데이터를 가공 하기 위해 추가
// YEAR로 하면 년도 자동 바인딩
onMounted(() => {
  if (props.type === "YEAR") {
    props2.items = []
    var yearSet = new Date()
    yearSet = yearSet.getFullYear()
    // 현대중공업 설립일(1973)
    for (let i = yearSet; i >= yearSet - (yearSet - props.minYear); i--) {
      props2.items.push(i + '')
    }
  } else if(props.type === "YEAR_ALL"){
    props2.items = []
    var yearSet = new Date()
    yearSet = yearSet.getFullYear()
    // 현대중공업 설립일(1973)
    props2.items.push('전체' + '')
    for (let i = yearSet; i >= yearSet - (yearSet - props.minYear); i--) {
      props2.items.push(i.toString() + '')
    }
  } else if(props.type === "MM") { //2024.06.05 박성학 월 추가
    props2.items = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  }
})

const emit = defineEmits(["update:modelValue"])
const handleSelect = (e) => {
  emit("update:modelValue", e)
}
</script>

<style scoped lang="scss">
.displayFlex {
  display: flex;
}
.dot {
  justify-content: normal !important;
  align-items: normal !important;
}
.selectBox {
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
}
</style>
