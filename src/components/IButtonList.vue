<script setup>
import initButtonItems from '@/utils/buttonList'
import { ref, computed } from 'vue'
import _ from 'lodash'

const props = defineProps({
  usePermission: {
    Type : Boolean,
    default: false,
  },
  buttonList: {
    Type : Array,
    default: [],
  },
  listWidth: {
    type: String,
    default: 'auto'
  },
  listHeight: {
    type: String,
    default: '35px'
  },
  alignX: {
    type: String,
    default: 'center' // start, end, center
  },
  alignY: {
    type: String,
    default: 'center' // start, end, center
  }
})

const btnListWidth = computed(() => {
  return props.listWidth
})
const btnListHeight = computed(() => {
  return props.listHeight
})

const buttonItems = ref(initButtonItems(props.buttonList))

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

const getButtonItems = () => {
  return buttonItems.value
}

const getButtonItemsById = id => {
  return _.find(buttonItems.value, { id: id }) ? _.find(buttonItems.value, { id: id }) : {}
}

defineExpose({
  setBtnProperty,
  getButtonItems,
  disableBtn,
}) 
</script>

<template>
  <div
    class="btn-list--main d-flex"
    :class="`justify-${props.alignX} align-${props.alignY}`"
  >
    <VBtn
      v-for="btn in props.buttonList"
      :id="btn"
      :key="`btn_${btn}`"
      v-permission="usePermission && !getButtonItemsById(btn).permission ? [btn] : []"
      v-show="getButtonItemsById(btn).visible"
      :prepend-icon="getButtonItemsById(btn).icon"
      :disabled="getButtonItemsById(btn).disable"
      class="titleBtn btn-list__item"
      @click="clickButton({ id: btn })"
    >
      {{ $t(getButtonItemsById(btn).text) }}
    </VBtn>
  </div>
</template>

<style scoped lang="scss">
.btn-list--main {
  width: v-bind(btnListWidth);
  height: v-bind(btnListHeight);

  // .btn-list__item {
  //   margin: 0;
  // }

  // .btn-list__item:not(:first-child) {
  //   margin-left: 4px;
  // }
}
</style>