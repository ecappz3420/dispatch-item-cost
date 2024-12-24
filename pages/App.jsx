"use client";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import currencies from "@/utils/currencies";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";

const formSchema = z.object({
  Item: z.string().nonempty({ message: "Item is required" }),
  Paying_In: z.object({
    currency: z.string(),
    amount: z.number(),
  }),
  Cost: z.object({
    currency: z.string(),
    amount: z.number(),
  }),
});

const App = () => {
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [convertedCurrency, setConvertedCurrency] = useState("ZMW");
  const [amount, setAmount] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [currencyModify, setCurrencyModify] = useState(0);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submission, setSubmission] = useState(false);

  const params = useSearchParams();
  const id = params.get("id");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Item: "",
      Paying_In: { currency: "USD", amount: 0 },
      Cost: { currency: "ZMW", amount: 0 },
    },
  });
  const { setValue, handleSubmit , reset } = form;

  useEffect(() => {
    if (id) {
      setEditMode(true);
      const fetchRecord = async () => {
        try {
          const queryParams = new URLSearchParams({
            reportName: "All_Dispatch_Item_Costs",
            criteria: `(ID == ${id})`,
          });
          const response = await fetch(`/api/zoho?${queryParams}`, {
            method: "GET",
          });
          const data = await response.json();
          if (data.records.code === 3000) {
            const record = data.records.data[0];
            setValue("Item", record.Item);
            setBaseCurrency(record.Base_Currency);
            setConvertedCurrency(record.Converted_Currency);
            setAmount(record.Paying_In?.replace(/[^0-9.]/g, "") || 0);
            setConvertedAmount(record.Cost?.replace(/[^0-9.]/g, "") || 0);
          }
          console.log(data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchRecord();
    }
  }, [id, reset]);

  

  const fetchExchangeRate = async (base, converted) => {
    try {
      const query = new URLSearchParams({ currency: base });
      const response = await fetch(`/api/currency-exchange?${query}`, {
        method: "GET",
      });
      const data = await response.json();
      return data.data.conversion_rates[converted];
    } catch (error) {
      console.error(error);
      return 0;
    }
  };

  const getExchangeRate = async () => {
    const exchange_rate = await fetchExchangeRate(
      baseCurrency,
      convertedCurrency
    );
    setExchangeRate(exchange_rate);
    setCurrencyModify(exchange_rate);
    const converted_amount = amount * exchange_rate;
    setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
  };
  useEffect(() => {
    if (!editMode) {
      getExchangeRate();
    }
  }, []);
  const handleCurrencyChange = async (currency) => {
    if (baseCurrency === currency) {
      setConvertedCurrency(currency);
    } else {
      setConvertedCurrency(currency);
      const exchange_rate = await fetchExchangeRate(baseCurrency, currency);
      setCurrencyModify(exchange_rate);
      setExchangeRate(exchange_rate);
      const converted_amount = amount * exchange_rate;
      setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
    }
  };
  const handleBaseCurrencyChange = async (currency) => {
    if (currency === convertedCurrency) {
      setBaseCurrency(currency);
    } else {
      setBaseCurrency(currency);
      const exchange_rate = await fetchExchangeRate(
        currency,
        convertedCurrency
      );
      setExchangeRate(exchange_rate);
      setCurrencyModify(exchange_rate);
      const converted_amount = amount * exchange_rate;
      setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
    }
  };
  const handleAmountChange = (value) => {
    setAmount(value);
    const converted_amount = value * exchangeRate;
    setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
  };
  const handleConversionRate = () => {
    setExchangeRate(currencyModify);
    const converted_amount = amount * currencyModify;
    setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
  };
  const onSubmit = async (data) => {
    setSubmission(true);
    const formData = {
      ...data,
      Paying_In: `${
        currencies.find((i) => i.code === baseCurrency).symbol
      } ${amount}`,
      Cost: `${
        currencies.find((i) => i.code === convertedCurrency).symbol
      } ${convertedAmount}`,
      Base_Currency: baseCurrency,
      Converted_Currency: convertedCurrency,
      Approval_Status: "Pending",
    };
    console.log(formData);
    try {
      const response = await fetch("/api/zoho", {
        method: editMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: editMode
          ? JSON.stringify({ formData, id })
          : JSON.stringify({ formName: "Dispatch_Item_Cost", formData }),
      });
      const result = await response.json();
      console.log(result);
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const onErrors = (errors) => {
    console.log("Errors:", errors);
  };

  return (
    <>
      <div className="p-2 bg-[#FAFBFE] ">
        <h4 className="font-medium">Dispatch Item Cost</h4>
      </div>
      <div className="px-2 pb-2">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit, onErrors)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 py-2 gap-4 justify-items-start">
              <FormField
                control={form.control}
                name="Item"
                render={({ field }) => (
                  <FormItem className="w-[300px] max-w-[300px]">
                    <FormLabel>Item</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <div>
                <FormField
                  control={form.control}
                  name="Paying_In"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paying In</FormLabel>
                      <div className="flex h-11 items-center border rounded space-x-2 w-[300px]">
                        <select
                          value={baseCurrency || "USD"}
                          onChange={(e) => {
                            const newValue = {
                              ...field.value,
                              currency: e.target.value,
                            };
                            field.onChange(newValue);
                            handleBaseCurrencyChange(e.target.value);
                          }}
                          className="p-2 rounded outline-none"
                        >
                          {currencies.map((curr, i) => (
                            <option value={curr.code} key={i}>
                              {curr.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={amount}
                          className="w-full border-0 outline-none p-2 rounded"
                          onChange={(e) => {
                            handleAmountChange(e.target.value);
                          }}
                        />
                      </div>
                    </FormItem>
                  )}
                />
                {baseCurrency !== convertedCurrency && (
                  <div className="p-1 text-xs flex items-center text-blue-500 justify-start gap-[10px]">
                    <div>{`1 ${baseCurrency} = ${exchangeRate} ${convertedCurrency}`}</div>
                    <small
                      className="cursor-pointer"
                      onClick={() => setOpen(true)}
                    >
                      Edit
                    </small>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modify Currency</DialogTitle>
                        </DialogHeader>
                        <div>
                          <Input
                            value={currencyModify}
                            onChange={(e) => setCurrencyModify(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={() => {
                              handleConversionRate();
                              setOpen(false);
                            }}
                          >
                            Save
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="Cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <div className="flex h-11 items-center border rounded space-x-2 w-[300px]">
                      <select
                        value={convertedCurrency || "ZMW"}
                        onChange={(e) => {
                          const newValue = {
                            ...field.value,
                            currency: e.target.value,
                          };
                          field.onChange(newValue);
                          handleCurrencyChange(e.target.value);
                        }}
                        className="p-2 rounded outline-none"
                      >
                        {currencies.map((curr, i) => (
                          <option value={curr.code} key={i}>
                            {curr.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={convertedAmount}
                        className="w-full border-0 outline-none p-2 rounded"
                        readOnly
                      />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-center gap-4 pt-[20px]">
              <Button type="submit" disabled={submission}>Submit</Button>
              <Button variant="outline" type="button">
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default App;
