<script setup>
import { ref } from "vue";
import initButtonItems from "@/utils/buttonList";
import _ from "lodash";

const props = defineProps({
  title: {
    Type: String,
    default: "",
  },
  usePermission: {
    Type: Boolean,
    default: false,
  },
  buttonList: {
    Type: Array,
    default: [],
  },
});

const buttonItems = ref(initButtonItems(props.buttonList));

const emit = defineEmits(["click-button"]);

const clickButton = (btn) => {
  emit("click-button", btn);
};

const disableBtn = (id, disableYn) => {
  let buttonList = getButtonItems();
  let btn = buttonList.find((x) => x.id == id);

  if(btn) {
    btn.disable = disableYn;
  }
};

const visibleBtn = (id, visibleYn) => {
  let buttonList = getButtonItems();
  let btn = buttonList.find((x) => x.id == id);

  if(btn) {
    btn.visible = visibleYn;
  }
};

const setBtnProperty = (id, propName, value) => {
  let buttonList = getButtonItems();
  let btn = buttonList.find((x) => x.id == id);

  if(btn) {
    btn[propName] = value;
  }
};

const getButtonItems = () => {
  return buttonItems.value;
};

const getButtonItemsById = (id) => {
  return _.find(buttonItems.value, { id: id })
    ? _.find(buttonItems.value, { id: id })
    : {};
};

defineExpose({
  setBtnProperty,
  getButtonItems,
  disableBtn,
  visibleBtn,
});
</script>

<template>
  <div
    class="d-flex mB-10 justify-space-between align-center"
    style="min-height: 30px"
  >
    <div class="d-flex align-center">
      <span class="gridTitle mR-10">
        {{ title }}
      </span>
      <div class="d-flex align-center">
        <div class="slotText">
          <slot name="editors" />
        </div>
      </div>
    </div>
    <div>
      <VBtn
        v-for="btn in props.buttonList"
        :id="btn"
        :key="`btn_${btn}`"
        v-permission="
          usePermission && !getButtonItemsById(btn).permission ? [btn] : []
        "
        v-show="getButtonItemsById(btn).visible"
        :prepend-icon="getButtonItemsById(btn).icon"
        :disabled="getButtonItemsById(btn).disable"
        class="titleBtn"
        @click="clickButton({ id: btn })"
      >
        {{ $t(getButtonItemsById(btn).text) }}
      </VBtn>
      <!-- <VBtn
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
      </VBtn>  -->
    </div>
  </div>
</template>
