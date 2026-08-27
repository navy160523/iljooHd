<template>
  <v-card class="mx-auto rounded-0 cardComponent rounded-0 pa-5 pb-0" width="100%">
    <template #title v-if="props.isTop">
      <v-row no-gutters class="d-flex align-center pL-10">
        <span
          v-if="props.gridTitle"
          class="cardComponentTitle mR-4"
          style="color: rgba(26, 64, 199, 0.5)"
          ><!-- 커스텀 클래스 직접 선언해서 사용해주시면 될듯합니다 -->
          {{ props.gridTitle }}
        </span>
        <span v-if="props.title" class="text-textMain cardComponentTitle mR-4"
          ><!-- 커스텀 클래스 직접 선언해서 사용해주시면 될듯합니다 -->
          {{ props.title }}
        </span>
        <span v-if="props.subTitle" class="cardComponentSubTitle mR-4"
          ><!-- 커스텀 클래스 직접 선언해서 사용해주시면 될듯합니다 -->
          {{ props.subTitle }}
        </span>
        <span v-if="props.caption" class="text-primary cardComponentCaption">
          {{ props.caption }}
        </span>
        <span v-if="props.tooltip" class="d-flex">
          <v-tooltip v-model="show" location="top">
            <template v-slot:activator="{ props }">
              <v-btn
                variant="plain"
                v-bind="props"
                width="30"
                height="32"
                class="cardComponentTooltip">
                <svg-icon name="tooltip" />
              </v-btn>
            </template>
            {{ props.tooltip }}
          </v-tooltip>
        </span>
      </v-row>
    </template>
    <template #append v-if="props.isTop">
      <div
        class="d-flex align-center"
        :class="props.btnList.length != 0 ? 'cardCompoenentBtn' : ''">
        <div v-for="(item, index) in props.btnList" :key="index">
          <v-btn
            @click="btnClick(item)"
            height="30"
            elevation="0"
            class=""
            :color="item.type == 'light' ? 'btnPrimary' : 'btnSecondary'">
            {{ item.text }}
          </v-btn>
          <v-divider
            thickness="1px"
            class="mL-20 mR-18 divider"
            vertical
            v-if="item.divide"></v-divider>
        </div>
      </div>
    </template>
    <template #default>
      <v-sheet :color="bgColor" class="cardComponentContentsCard">
        <v-card class="bg-base" :class="props.gridTitle ? 'pa-0' : 'pY-20 pR-20'">
          <slot name="default"></slot>
        </v-card>
      </v-sheet>
    </template>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  isTop: { type: Boolean, default: true },
  gridTitle: { type: String, default: null },
  title: { type: String, default: null },
  subTitle: { type: String, default: null },
  caption: { type: String, default: null },
  tooltip: { type: String, default: null },
  bgColor: { type: String, default: 'base' },
  btnList: { type: Array, default: () => [] },
  contentBackColor: { type: String, default: '' }
})
const show = ref(false)
const emit = defineEmits(['btnClick'])
const btnClick = (e) => {
  emit('btnClick', e)
}
</script>

<style lang="scss" scoped>
.cardComponentTitle {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
}

.cardComponentSubTitle {
  font-size: 18px;
  font-weight: 300;
  margin-bottom: 10px;
}

.cardComponentCaption {
  font-size: 14px;
  font-weight: 300;
  margin-bottom: 10px;
}

.cardComponentContentsCard {
  border-radius: 3px;
}

.cardComponentTooltip {
  margin-bottom: 10px;
}
.cardCompoenentBtn {
  margin-bottom: 10px;
  .v-btn {
    margin-left: 5px;
  }
}
.divider {
  height: 20px;
  vertical-align: middle;
}
</style>
