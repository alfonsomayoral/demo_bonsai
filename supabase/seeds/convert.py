
import pandas as pd, pathlib, textwrap, json
csv = "supabase/seeds/exercises_seed.csv"          # <-- tu CSV
df  = pd.read_csv(csv)

def esc(val):
    if pd.isna(val) or val == "null" or val == "NaN":
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

values = [
    "(" + ", ".join(esc(v) for v in row) + ")"
    for row in df.itertuples(index=False)
]

sql = textwrap.dedent(f"""\
    INSERT INTO public.exercises
      (name, muscle_group, difficulty, description, image_url)
    VALUES
      {",\n      ".join(values)}
    ON CONFLICT (lower(name)) DO NOTHING;
""")

path = pathlib.Path("supabase/seeds/exercises_seed.sql")
path.write_text(sql, encoding="utf-8")
print("✔  Seed SQL generado:", path)

