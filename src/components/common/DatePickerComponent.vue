<template>
  <v-col class="d-flex align-center pa-0 width">
    <span class="titleWidth formLabelText d-flex">{{ props.title }}</span>
    <v-text-field
      type="date"
      variant="outlined"
      color="primary"
      base-color="inputDisabled"
      bg-color="#fff"
      v-model="input"
      @input="handleInput">
      <!-- <template v-slot:append-inner>
        <svg-icon name="calendar" />
      </template> -->
    </v-text-field>
  </v-col>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({
  title: { type: String, default: null }, // span의 텍스트
  titleWidth: { type: String, default: '' }, // span 너비
  width: { type: String, default: '500px' }, //전체 넓이
  modelValue: { type: String, default: '' } //V-Model
})
const width = computed(() => {
  return props.width
})
const titleWidth = computed(() => {
  return props.titleWidth
})

// v-text-field 의 형식은 yyyy-mm-dd 형식
// v-date-pick의 형식은 iso8601 형식이므로
// 상호 형변환을 하며 2개의 데이터 변수 사용

function convertToISO8601(dateString) {
  const [year, month, day] = dateString.split('-')
  const dateObject = new Date(year, month - 1, day)
  return dateObject
}
function convertFromISO8601(iso8601String) {
  const dateObject = new Date(iso8601String)
  const year = dateObject.getFullYear()
  const month = String(dateObject.getMonth() + 1).padStart(2, '0') // 월은 0부터 시작하므로 +1 필요
  const day = String(dateObject.getDate()).padStart(2, '0')
  const yyyyMMddString = `${year}-${month}-${day}`
  return yyyyMMddString
}

const input = ref(props.modelValue)
const isoDate = ref(null)
watch(
  () => props.modelValue,
  () => {
    isoDate.value = convertToISO8601(props.modelValue)
  }
)
watch(
  () => isoDate.value,
  () => {
    input.value = convertFromISO8601(isoDate.value)
    dialog.value = false
  }
)

const emit = defineEmits(['update:modelValue'])
const handleInput = (e) => {
  emit('update:modelValue', input.value)
}

const dialog = ref(false)
const openDialog = () => {
  dialog.value = true
}
</script>

<style>
.width {
  max-width: v-bind(width);
}
.titleWidth {
  width: v-bind(titleWidth);
  justify-content: v-bind(justify);
  margin-right: v-bind(margin);
}
</style>
