<script setup>
import { ref, reactive, onMounted } from 'vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useI18n } from 'vue-i18n'

// Internationalization
const { t } = useI18n()

// Variables
const dialog = ref(false)

// Functions to open and close the popup
const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

// Table data setup
const tableData = reactive({
  rows: [],
})

// Populate table rows in onMounted
onMounted(() => {
  tableData.rows.push(
    { riskLevel: '상', severity: '매우 높음', criteria: "'○' 개수 8~10" },
    { riskLevel: '중', severity: '보통', criteria: "'○' 개수 5~7" },
    { riskLevel: '하', severity: '매우 낮음', criteria: "'○' 개수 0~4" },
  )
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="940"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
  <v-sheet
      color="primary"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>위험성평가 수준평가</span>
      <div></div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5 ">
      <v-card-text class="pa-4 pt-4 content-area">
        <table class="table">
          <thead>
            <tr>
              <th class="text-center">수준평가</th>
              <th class="text-center">판단 기준</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData.rows" :key="row.riskLevel">
              <td class="text-center">{{ row.riskLevel }}</td>
              <!-- <td class="text-center">{{ row.severity }}</td> -->
              <td class="pre-line">{{ row.criteria }}</td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
      <!-- Close button -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="closePopup">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.text-center {
  text-align: center;
}

.table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.v-card-text {
  padding: 0;
}
.pre-line {
  white-space: pre-line;
}
</style>
