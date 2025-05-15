import pandas as pd
df = pd.read_excel('上行各站8点到10点10秒客流分布.xlsx')
df.to_csv('public/up_flow_8_10.csv', index=False)

df = pd.read_excel('下行各站8点到10点10秒客流分布.xlsx')
df.to_csv('public/down_flow_8_10.csv', index=False)


