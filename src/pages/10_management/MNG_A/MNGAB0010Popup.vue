<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련

const t = useI18n().t //다국어
const dialog = ref(false)
const grd1 = ref(null)
const grd2 = ref(null)

const list3 = reactive([
  ['5','10','15','20','25'],
  ['4','8','12','16','20'],
  ['3','6','9','12','15'],
  ['2','4','6','8','10'],
  ['1','2','3','4','5'],
])

const grd1List = reactive([
  {idx: '1', grade: '매우 낮음', detail: '2년간 1회 정도 발생 또는 그 미만' , score: '1 점'},
  {idx: '2', grade: '낮음', detail: '1년간 1회 정도 발생' , score: '2 점'},
  {idx: '3', grade: '보통', detail: '분기 1회 정도 발생' , score: '3 점'},
  {idx: '4', grade: '높음', detail: '월 1회 정도 발생' , score: '4 점'},
  {idx: '5', grade: '매우 높음', detail: '주 1회 정도 발생 또는 그 이상' , score: '5 점'},
])

const grd2List = reactive([
  {idx: '1', grade: '매우 낮음', detail: '조직에 영향을 거의 미치지 않음' , score: '1 점'},
  {idx: '2', grade: '낮음', detail: '조직의 일부에 경중한 영향을 미침' , score: '2 점'},
  {idx: '3', grade: '보통', detail: '조직 전체에 경중한 영향을 미침' , score: '3 점'},
  {idx: '4', grade: '높음', detail: '조직의 일부에 중대한 영향을 미침' , score: '4 점'},
  {idx: '5', grade: '매우 높음', detail: '조직 전체에 중대한 영향을 미침' , score: '5 점'},
])

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [
    // { fieldName: 'idx', dataType: 'text', header: { text: t('순') } },
    { fieldName: 'grade', dataType: 'text', header: { text: t(' ') } },
    { fieldName: 'detail', dataType: 'text', header: { text: t(' ') }, width: '150' },
    { fieldName: 'score', dataType: 'text', header: { text: t('점수') } },
  ],
  columns : [],
})
grd1Props.columns = grd1Props.fields

//그리드 속성셋팅
const grd2Props = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [
    // { fieldName: 'idx', dataType: 'text', header: { text: t('순') } },
    { fieldName: 'grade', dataType: 'text', header: { text: t(' ') } },
    { fieldName: 'detail', dataType: 'text', header: { text: t(' ') }, width: '150' },
    { fieldName: 'score', dataType: 'text', header: { text: t('점수') } },
  ],
  columns : [],
})
grd2Props.columns = grd2Props.fields

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
  grd1.value.getDataProvider().setRows(grd1List)
  grd2.value.getDataProvider().setRows(grd2List)
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
    height="900"
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
      <span>리스크 및 기회 평가 기준</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-0">
          <IGridTitle 
            ref="gridTitle"
            :button-list="['btnClose']"
            @click-button="onClose"
            class="mb-0"
          />
        </v-card-title>
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet>
              <IGridTitle 
                :title="$t('1. 리스크 및 기회평가 Matrix')"
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
            <v-sheet class="pt-4 h-auto">
              <IGridTitle 
                :title="$t('2. 발생 가능성')"
              />
              <RealGrid
                ref="grd1"
                :grid-view-option="grd1Props.gridViewOption"
                :keys="grd1Props.keys" 
                :fields="grd1Props.fields"
                :columns="grd1Props.columns"
              />
            </v-sheet>
            <v-sheet class="pt-4 h-auto">
              <IGridTitle 
                :title="$t('3. 결과 중대성')"
              />
              <RealGrid
                ref="grd2"
                :grid-view-option="grd2Props.gridViewOption"
                :keys="grd2Props.keys" 
                :fields="grd2Props.fields"
                :columns="grd2Props.columns"
              />
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