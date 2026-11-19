import torch,sys
from transformers import AutoModelForSequenceClassification
from onnxruntime.quantization import quantize_dynamic,QuantType
src=sys.argv[1];out=sys.argv[2]
m=AutoModelForSequenceClassification.from_pretrained(src).eval()
class W(torch.nn.Module):
    def __init__(s,m):super().__init__();s.m=m
    def forward(s,input_ids,attention_mask,token_type_ids):return s.m(input_ids=input_ids,attention_mask=attention_mask,token_type_ids=token_type_ids).logits
x=torch.ones(1,16,dtype=torch.long)
torch.onnx.export(W(m),(x,x,torch.zeros_like(x)),out+"/model.onnx",input_names=["input_ids","attention_mask","token_type_ids"],output_names=["logits"],
  dynamic_axes={k:{0:"b",1:"s"} for k in ["input_ids","attention_mask","token_type_ids"]}|{"logits":{0:"b"}},opset_version=17,dynamo=False)
quantize_dynamic(out+"/model.onnx",out+"/model_quantized.onnx",weight_type=QuantType.QInt8)
print("ok")
