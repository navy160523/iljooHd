<script setup>
import { ref, watch, getCurrentInstance, computed, readonly } from 'vue'

const props = defineProps({
  reverse: {
    type: Boolean,
    default() {
      return true
    }
  },
  modelValue: {
    type: [String, Number],
    default() {
      return 0
    }
  },
  readonly: {
    type: Boolean,
    default() {
      return false
    }
  },
})

const emit = defineEmits([
  'update:modelValue'
])

const vm = getCurrentInstance().proxy
const refCom = ref(null)
const refNum = ref(null)
const comShow = ref(true)
const numShow = ref(false)
const input = ref(props.modelValue)

watch(
  () => props.modelValue,
  () => {
    // console.log('props.modelValue', props.modelValue)
    input.value = Number(props.modelValue)
    
    // if(props.modelValue === undefined || props.modelValue === null) {
    //   input.value = '0'
    // } else {
    //   let temp = String(props.modelValue).replace(/[^0-9.-]/g, '').replace(/(\..*)\./g, '$1')

    //   if(temp * 1.0 > 1 && temp.substring(0, 1) == 0) {
    //     temp = temp.substring(1)
    //   } else if(temp * 1.0 < -1 && temp.substring(1, 2) == 0) {
    //     temp = temp.substring(0, 1) + temp.substring(2)
    //   }

    //   input.value = temp ? temp : '0'
    // }

    // console.log('input.value', input.value)
  }
)

const showVal = computed(() => {
  let result = '0'

  if(!isNaN(input.value)) {
    result = (input.value * 1).toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  return result
})

const comFocus = () => {
  // console.log('comFocus')

  if(!props.readonly) {
    comShow.value = false
    numShow.value = true

    vm.$nextTick(() => {
      // refNum.value.focus()
      refNum.value.select()
    })
  }
}

const numBlur = () => {
  // console.log('numBlur')

  if(!props.readonly) {
    comShow.value = true
    numShow.value = false
  }
}
</script>

<template>
  <div class="w-full">
    <v-text-field
      v-show="comShow"
      :value="showVal"
      ref="refCom"
      @focus="comFocus"
      :reverse="props.reverse"
      :readonly="props.readonly"
    />
    <!-- <v-text-field v-show="numShow" v-model="input" ref="refNum" @blur="numBlur" :reverse="props.reverse" /> -->
    <input
      type="number"
      v-show="numShow && !props.readonly"
      v-model="input"
      ref="refNum"
      @blur="numBlur"
      @keyup.enter="numBlur"
      class="input-comp"
      :class="[props.reverse ? 'right' : '']"
      @input="$emit('update:modelValue', $event.target.value ? Number($event.target.value) : 0)"
    />
  </div>
</template>

<style lang="scss" scoped>
.input-comp {
  height: 35px;
  width: 100%;
  background-color: #ffffff;
  outline: none;
  padding: 5px 10px;
  font-size: 14px;
}

.input-comp::-webkit-outer-spin-button,
.input-comp::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-comp:focus {
  border: 1px solid rgb(230, 230, 230);
}

.input-comp.right {
  text-align: right;
}
</style>