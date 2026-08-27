<template>
  <div
    class="align-center inputBox"
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
    <v-text-field
      v-show="showDate"
      ref="inputRef"
      :min="props.min !== null ? props.min : ''"
      :max="props.max !== null ? props.max : ''"
      :variant="props.variant"
      color="primary"
      base-color="inputDisabled"
      :bg-color="props.bgColor"
      v-model="input"
      @input="handleInput"
      @click:appendInner="emit('click:appendInner')"
      :disabled="props.disabled"
      :type="
        props.type !== null ? (props.password ? 'password' : props.type) : ''
      "
      :readonly="props.readonly"
      :placeholder="props.placeholder"
      :maxlength="props.maxlength"
      :reverse="props.reverse"
      :oninput="props.oninput"
      :rules="rules"
      :validation-value="validInput"
      :suffix="props.suffix"
      @blur="leaveFocus"
      :class="props.setBgColor !== '' ? props.setBgColor : ''"
      >
      <!-- @dblclick="dblclick" -->
      <template v-slot:append-inner>
        <!-- mdi-magnify svg 변경 -->
        <svg-icon
          v-if="props.appendInnerIcon == 'mdi-magnify'"
          name="condition_search"
          @click="emit('click:appendInner')"
          class="appendInner"
        ></svg-icon>

        <v-icon
          v-if="props.clearable && input && input !== '전체'"
          name="clearable"
          icon="mdi-close-circle-outline"
          @click="emit('click:clearable')"
          class="appendInner"
        ></v-icon>

        <v-icon
          v-if="props.appendInnerIcon == 'mdi-file-upload-outline'"
          name="file_upload"
          icon="mdi-file-upload-outline"
          @click="emit('click:appendInner')"
          class="appendInner"
        ></v-icon>

        <slot name="append-inner"></slot>
      </template>
    </v-text-field>
    <!-- <v-text-field v-show="!showDate" v-model="input" @keyup.enter="enterDate" /> -->
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { ref, watch, computed, onMounted } from 'vue'
import Message from '@hiway/utils/notify'
import { useI18n } from 'vue-i18n'
const t = useI18n().t //다국어
const props = defineProps({
  clearable: { type: Boolean, default: false },
  topLabel: { type: Boolean, default: false },
  label: { type: String, default: null }, //라벨 이름
  width: { type: String, default: '500px' }, //전체 넓이
  labelWidth: { type: String, default: 'auto' }, // title 영역 넓이
  disabled: { type: Boolean, default: false }, //disable 처리
  modelValue: { type: [String, Number], default: '' }, //V-Model
  justify: { type: String, default: 'start' }, //라벨 가운데 정렬 여부 (start, end, center)
  min: { type: [Number, String], default: null }, // 최소값
  max: { type: [Number, String], default: null }, //최대값
  type: { type: String, default: null }, // 타입
  readonly: { type: Boolean, default: false }, //readonly
  appendInnerIcon: { type: String, default: null },
  placeholder: { type: String, default: null },
  margin: { type: String, default: '20px' }, //오른쪽 마진
  marginBetween: { type: String, default: '8px' }, // 라벨과 인풋 사이 마진 (between-inner 슬롯 사용시)
  maxlength: { type: String, default: '' }, // 최대 문자 입력 수
  reverse: { type: Boolean, default: false }, // 우측정렬
  oninput: { type: String, default: '' },
  suffix: { type: String, default: '' },
  bgColor: { type: String, default: '#fff' },
  setBgColor: { type: String, default: '' },
  //--------validation--------

  required: { type: Boolean, default: false }, //필수입력값
  minlength: { type: Number, default: 0 }, // 최대 문자 입력 수
  email: { type: Boolean, default: false },
  korean: { type: Boolean, default: false },
  english: { type: Boolean, default: false },
  number: { type: Boolean, default: false },
  phone: { type: Boolean, default: false },
  cost: { type: Boolean, default: false },
  variant: { type: String, dafault: 'outlined' },
  useDateCopy: { type: Boolean, default: false },
  nullMsg: { type: Boolean, default: true },
})
const width = computed(() => props.width)
const labelWidth = computed(() => props.labelWidth)
const margin = computed(() => props.margin)
const marginBetween = computed(() => props.marginBetween)
const showDate = ref(true)
const inputRef = ref(null)
const validInput = ref(props.modelValue) // validation 체크를 위한 input.value
const input = ref(props.modelValue) // 실제 data
watch(
  () => props.modelValue,
  () => {
    input.value = props.modelValue
    validInput.value = props.modelValue
  }
)

const leaveFocus = () => {
  validInput.value = input.value
}
const emit = defineEmits([
  'update:modelValue',
  `click:appendInner`,
  'click:clearable',
])

//validation
const rule = {
  // required: (value) => !!value || `${props.label}은(는) 필수입니다.`,
  counter: (value) =>
    value.length >= props.minlength ||
    `${props.minlength}글자 이상 입력하세요.`,
  email: (value) => {
    const nullRemovePattern = ref(/\s/g)
    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    let trimData = value.replace(nullRemovePattern, '')
    return pattern.test(trimData) || '이메일 주소가 유효하지 않습니다.'
  },
  password: (value) => {
    // 최소 8 자, 최소 하나의 문자, 하나의 숫자 및 하나의 특수 문자 :
    const nullRemovePattern = ref(/\s/g)
    const pattern =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[a-zA-Z\d!@#$%^&*()_+]{8,20}$/
    let trimData = value.replace(nullRemovePattern, '')
    return (
      pattern.test(trimData) ||
      '8자리 이상 20자 이하 입력 [영문, 숫자, 특수문자 포함]'
    )
  },
  korean: (value) => {
    const pattern = /^$|^[ㄱ-ㅎㅏ-ㅣ가-힣|\s]+$/
    return pattern.test(value) || '한글만 입력 가능합니다'
  },
  english: (value) => {
    const pattern = /^$|^[a-zA-Z|\s]+$/
    return pattern.test(value) || '영어만 입력 가능합니다'
  },
  number: (value) => {
    const pattern = /^$|^[0-9|\s.]+$/
    return pattern.test(value) || '숫자만 입력 가능합니다'
  },
  phone: (value) => {
    const pattern = /^$|^[0-9|\s-]+$/
    return pattern.test(value) || '올바른 핸드폰번호를 입력해주세요.'
  },
  // (김동건, 2025-02-14) 숫자+콤마
  cost: (value) => {
    const pattern = /^$|^[0-9\s,]+$/
    return pattern.test(value) || '숫자만 입력 가능합니다.'
  }
}
let rules = ref([])
onMounted(() => {
  rules.value = []
  // if (props.required) rules.value.push(rule.required)
  if (props.minlength) rules.value.push(rule.counter)
  if (props.email) rules.value.push(rule.email)
  if (props.phone) rules.value.push(rule.phone)
  if (props.type == 'password') rules.value.push(rule.password)
  if (props.korean) rules.value.push(rule.korean)
  if (props.english) rules.value.push(rule.english)
  if (props.number) rules.value.push(rule.number)
  if (props.cost) rules.value.push(rule.cost)
})

const legacyInput = ref('') // 이전 input.value 저장 (valid true 값만 저장)
const handleInput = (e) => {
  validInput.value = input.value //현재 인풋값을 체크벨류로 저장
  if (props.korean && rule.korean(input.value) != true) {
    //문자열 또는 true 리턴
    input.value = legacyInput.value //롤백
  } else if (props.english && rule.english(input.value) != true) {
    //문자열 또는 true 리턴
    input.value = legacyInput.value //롤백
  } else if (
    (props.number && rule.number(input.value) != true) ||
    (props.phone && rule.phone(input.value) != true) ||
    (props.cost && rule.cost(input.value) != true)
  ) {
    //문자열 또는 true 리턴
    input.value = legacyInput.value //롤백
  }
  legacyInput.value = input.value //이전 데이터 저장

  // 핸드폰 유효성검사
  if (props.phone && rule.phone(input.value) && input.value.length === 11) {
    input.value = input.value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  if (props.phone && input.value.length > 13) {
    input.value = input.value.slice(0, 13)
  }

  // 김성근 추가 05 31 없는 날짜 알람띄어주기
  // 손상규 추가 && '!props.modelValue' 날짜 삭제시 데이터가 남아있어서 추가함
  if ((props.type === 'Date' || props.type === 'date') && (!input.value && !props.modelValue && props.nullMsg)) {
    return Message.warn(t(`올바른 날짜를 입력해주세요`))
  }

  // 핸드폰 유효성검사 종료
  emit('update:modelValue', input.value)
}

const focus = () => {
  inputRef.value.focus()
}

// const dblclick = () => {
//   if(props.type === 'date' && props.useDateCopy) {
//     // console.log('dblclick')

//     showDate.value = false
//   }
// }

// const enterDate = () => {
//   if(props.type === 'date') {
//     showDate.value = true
//   }
// }

defineExpose({
  focus
})
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
.displayFlex {
  display: flex;
}
.appendInner {
  cursor: pointer;
}
</style>
