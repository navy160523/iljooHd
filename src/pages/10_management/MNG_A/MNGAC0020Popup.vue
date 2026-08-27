<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from "@/components/ILabel.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련

const t = useI18n().t //다국어
const dialog = ref(false)

const list = reactive([
  { bindo: '빈도등급', balsaeng: '발생횟수' },
  { bindo: '1등급(매우적음)', balsaeng: '1회/년 미만' },
  { bindo: '2등급(적음)', balsaeng: '1회/반기 이하' },
  { bindo: '3등급(보통)', balsaeng: '1회/회 분기' },
  { bindo: '4등급(많음)', balsaeng: '1회/월 이하' },
  { bindo: '5등급(빈번함)', balsaeng: '1회/월 초과' },
])

const list2 = reactive([
  { gangdo: '강도등급', yeong: '영향정도' },
  { gangdo: '1등급', yeong: '환경영향의 위험성이 매우적음' },
  { gangdo: '2등급', yeong: '환경영향의 위험성이 적음' },
  { gangdo: '3등급', yeong: '환경영향의 위험성이 보통' },
  { gangdo: '4등급', yeong: '환경영향의 위험성이 중대함' },
  { gangdo: '5등급', yeong: '환경영향의 위험성이 매우 중대함' },
])

const list3 = reactive([
  ['5','10','15','20','25'],
  ['4','8','12','16','20'],
  ['3','6','9','12','15'],
  ['2','4','6','8','10'],
  ['1','2','3','4','5'],
])

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

const color = val => {
  let backgroundColor = 'green'
  if(val > 4){
    backgroundColor = 'yellow'
  }
  if(val > 10){
    backgroundColor = 'red'
  }

  return backgroundColor
}

const openPopup = () => {
  dialog.value = true
}

const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

onMounted(() => {
  window.addEventListener("mousemove", mouseUpdate)
})
</script>

<template style="margin: 0px">
<!-- persistent  << 영역 밖 클릭시 안닫히게 -->
  <VDialog
    v-model="dialog"
    eager
    width="950"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>환경영향평가</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
          <IGridTitle 
            ref="gridTitle"
            :button-list="['btnClose']"
            @click-button="onClose"
          />
        </v-card-title>
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet>
              <IGridTitle 
                :title="$t('1. 빈도등급 평가')"
              />
              <VTable density="comfortable" class="text-center border">
                <tbody>
                  <tr>
                    <th 
                      class="border pa-2 text-center thBg"
                      v-for="(item, i) in list"
                      :key="i"
                      :width="1/6"
                    >
                      {{ item.bindo }}
                    </th>
                  </tr>
                  <tr>
                    <td 
                      v-for="(item, i) in list"
                      :key="i"
                      :width="1/6"
                      :class="i === 0 ?'thBg border pa-2' : 'border pa-2' "
                    >
                      {{ item.balsaeng }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </v-sheet>
            <v-sheet class="pt-4">
              <IGridTitle 
                :title="$t('2. 강도등급 평가')"
              />
              <VTable density="comfortable" class="text-center border">
                <tbody>
                  <tr>
                    <th 
                      class="border pa-2 text-center thBg"
                      v-for="(item, i) in list2"
                      :key="i"
                      :width="1/6"
                    >
                      {{ item.gangdo }}
                    </th>
                  </tr>
                  <tr>
                    <td
                      v-for="(item, i) in list2"
                      :key="i"
                      :width="1/6"
                      :class="i === 0 ?'thBg border pa-2' : 'border pa-2' "
                    >
                      {{ item.yeong }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </v-sheet>
            <v-sheet class="pt-4">
              <IGridTitle 
                :title="$t('3. 환경영향 평가')"
              />
              <div class="d-flex w-100">
                <div class="flex-fill">
                  <VTable density="comfortable" class="text-center border">
                    <tbody>
                      <tr
                        v-for="(item, a) in list3"
                        :key="a"
                      >
                        <td 
                          class="border pa-2"
                          v-for="(count, b) in item"
                          :key="b"
                          :width="1/6"
                          :class="dialog ? color(count) : ''"
                        >
                          {{ count }}
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </div>

                <div class="flex-colum ml-4" style="width: 300px;">
                  <VRow class="red mt-1 mb-3">
                    <VCol align="center" align-self="center" style="font-size: 16pt;">High</VCol>
                    <VCol align="center" class="high pa-1">
                      <div>중대사안</div><div>(12 ~ 25점)</div>
                    </VCol>
                  </VRow>
                  <VRow class="yellow mt-0 mb-3">
                    <VCol align="center" align-self="center" style="font-size: 16pt;">Medium</VCol>
                    <VCol align="center" class="medium pa-1">
                      <div>관리사안</div><div>(5 ~ 11점)</div>
                    </VCol>
                  </VRow>
                  <VRow class="green mt-0 mb-3">
                    <VCol align="center" align-self="center" style="font-size: 16pt;">Low</VCol>
                    <VCol align="center" class="row pa-1">
                      <div>관찰사안</div><div>(1 ~ 4점)</div>
                    </VCol>
                  </VRow>
                </div>
              </div>
            </v-sheet>
          </div>
        </v-card-text>

    </v-card>
  </VDialog>
</template>

<style scoped>
.yellow{
  font-weight: bold;
  background-color: #f7fb20;
}
.green{
  font-weight: bold;
  background-color: #81ef81;
}

.red{
  font-weight: bold;
  background-color: #ff4f4f;
}
.high{
  background-color: white;
  border: 3px solid #ff4f4f;
}
.medium{
  background-color: white;
  border: 3px solid #f7fb20;
}
.row{
  background-color: white;
  border: 3px solid #81ef81;
}
.thBg{
  background-color: #e8eaf2;
}
</style>