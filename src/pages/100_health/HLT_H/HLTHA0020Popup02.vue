
<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import IMenuTitle from "@/components/IGridTitle.vue";
import HLTHA0040 from "./HLTHA0040.vue";
import { stubFalse } from "lodash-es";

const dialog = ref(null);
const popup = ref();

const openPopup = async (param) => {
  await popup.value.popupSet(param);
  await popup.value.popupSearch();
  dialog.value = true;
};

const clickClose = () => {
  dialog.value = false;
};

const clickSearch = async () => {
  await popup.value.popupSearch();
};

defineExpose({
  openPopup,
});
</script>




<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1400"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>지급이력 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0 d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <span class="menuTitle redLabel" />
        </div>
        <div>
          <div>
            <v-btn @click="clickSearch">조회</v-btn>
            <v-btn @click="clickClose">닫기</v-btn>
          </div>
        </div>
      </v-card-title>
      <v-card-text class="pa-2 pt-0">
        <div class="d-flex mt-2" :style="{ height: '600px' }">
          <HLTHA0040 ref="popup" :isPopup="true" />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>