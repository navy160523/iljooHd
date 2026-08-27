<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import IUpload from '@/components/IUpload.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'

defineOptions({
  name: '00_sample-UploadTest',
})

const testRef = ref(null)
let fileId = ref(null)

onMounted(() => {
  console.log('testRef.value', testRef.value)
  testRef.value.setGuid('T2023-001')
})

const aaa = ref(0)

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    // testRef.value.setGuid('T2023-001')
    testRef.value.onButtonsClick( { id: 'btnSearch' } )
  }
}

const uploaded = param => {
  console.log('uploaded param', param)
}
</script>

<template>
  <VContainer class="pt-0">
    <VRow>
      <VCol>
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
      </VCol>
    </VRow>
    <!-- 조회조건 -->
    <VRow style="height: 600px;">
      <VCol>
        <IUpload ref="testRef" :fileId="fileId" :maxFileSize="2024" @uploaded="uploaded($event)" />
      </VCol>
    </VRow>
  </VContainer>
</template>