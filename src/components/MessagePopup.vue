<script setup>
const vm = getCurrentInstance().proxy //다이얼로그관련
import { onMounted, reactive, ref } from 'vue'

const visible = ref(false)
const title = ref(null)
const grdData = ref(null)
const emit = defineEmits(['confirmed'])
let resolver = null

const openMessagePopup = (titleMessage, data) => {
  title.value = titleMessage
  grdData.value = data
  visible.value = true

  //함수호출될때 Promise 객체 반환해서 저장하고있음
  return new Promise((resolve) => {
    resolver = resolve
  })
}

watch(visible, async (newValue) => {
  if (newValue) {
    let result = await vm.$swal({
      title: title.value,
      html: grdData.value ? grdData.value : '',
    })

    visible.value = false

    if (result.isConfirmed) {
      emit('confirmed')
    }

    //팝업 종료되면 Promise 해제
    if (resolver) {
      resolver()
      resolver = null
    }
  }
})

defineExpose({
  openMessagePopup,
})
</script>
